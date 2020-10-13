import { createModuleDebug, TRACE_ENABLED } from '../utils/debug';
import { DataSize, getDataSize, isArrayType } from './datatypes';
import { AbiItemDefinition, AbiInput } from './item';
import { computeSignature, encodeParam } from './signature';
import { abiDecodeParameters, Value } from './wasm';

const { trace } = createModuleDebug('abi:decode');

export interface DecodedParameter {
    name?: string;
    type: string;
    value: Value | DecodedStruct;
}

export interface DecodedFunctionCall {
    name: string;
    signature: string;
    params: DecodedParameter[];
    args?: { [name: string]: Value | DecodedStruct };
}

export interface DecodedLogEvent {
    name: string;
    signature: string;
    params: DecodedParameter[];
    args?: { [name: string]: Value | DecodedStruct };
}

export function getInputSize(abi: AbiItemDefinition): DataSize {
    try {
        return abi.inputs
            .map(input => getDataSize(encodeParam(input)))
            .reduce((total, cur) => ({ length: total.length + cur.length, exact: total.exact && cur.exact }), {
                length: 0,
                exact: true,
            });
    } catch (e) {
        throw new Error(`Failed to determine input size for ${computeSignature(abi)}: ${e.message}`);
    }
}

export const isTuple = (inputDef: AbiInput): boolean => inputDef.type === 'tuple';

export const encodeInputType = (inputDef: AbiInput): string =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    isTuple(inputDef) ? encodeTupleInputType(inputDef) : inputDef.type;

export function encodeTupleInputType(itemDef: AbiInput): string {
    if (!itemDef.components?.length) {
        // invalid tuple definition without component types
        return 'tuple';
    }
    const serializedComponentTypes = itemDef.components.map(c => encodeInputType(c)).join(',');
    return `(${serializedComponentTypes})`;
}

export type DecodedStruct = { [k: string]: Value | DecodedStruct };

export function reconcileStructFromDecodedTuple(decodedTuple: Value[], inputDef: AbiInput): DecodedStruct | null {
    if (!inputDef.components?.length || !Array.isArray(decodedTuple)) {
        return null;
    }
    const result: DecodedStruct = {};
    for (const [i, component] of inputDef.components.entries()) {
        if (!component.name) {
            // no name provided for at least one component of the tuple - skipping struct reconciliation
            return null;
        }
        if (isTuple(component)) {
            const value = reconcileStructFromDecodedTuple(decodedTuple[i] as Value[], component);
            if (value == null) {
                result[component.name] = decodedTuple[i];
            } else {
                result[component.name] = value;
            }
        } else {
            result[component.name] = decodedTuple[i];
        }
    }

    return result;
}

export const reconcileStructs = (decodedValues: Value[], inputDefs: AbiInput[]): Array<Value | DecodedStruct> =>
    decodedValues.map((val, i) => {
        const input = inputDefs[i];
        if (isTuple(input)) {
            const structData = reconcileStructFromDecodedTuple(val as Value[], input);
            if (structData != null) {
                return structData;
            }
        }
        return val;
    });

export function decodeFunctionCall(
    data: string,
    abi: AbiItemDefinition,
    signature: string,
    anonymous: boolean,
    shouldReconcileStructs: boolean
): DecodedFunctionCall {
    const inputs = abi.inputs ?? [];
    let decodedParams: Array<Value | DecodedStruct> = abiDecodeParameters(data.slice(10), inputs.map(encodeInputType));
    if (shouldReconcileStructs) {
        decodedParams = reconcileStructs(decodedParams as Value[], inputs);
    }

    const params: DecodedParameter[] = [];
    const args: { [name: string]: Value | DecodedStruct } = {};

    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const value = decodedParams[i];
        if (input.name != null) {
            args[input.name] = value;
        }
        params.push({
            name: anonymous ? undefined : input.name,
            type: input.type,
            value,
        });
    }

    return {
        name: abi.name!,
        signature,
        params,
        args: anonymous ? undefined : args,
    };
}

export function decodeBestMatchingFunctionCall(
    data: string,
    abis: AbiItemDefinition[],
    anonymous: boolean,
    reconcileStructShapeFromTuples: boolean
): DecodedFunctionCall {
    if (abis.length === 1) {
        // short-circut most common case
        return decodeFunctionCall(data, abis[0], computeSignature(abis[0]), anonymous, reconcileStructShapeFromTuples);
    }
    const abisWithSize = abis.map(abi => [abi, getInputSize(abi)] as const);
    const dataLength = (data.length - 10) / 2;
    let lastError: Error | undefined;
    // Attempt to find function signature with exact match of input data length
    for (const [abi, { length, exact }] of abisWithSize) {
        if (dataLength === length && exact) {
            try {
                return decodeFunctionCall(data, abi, computeSignature(abi), anonymous, reconcileStructShapeFromTuples);
            } catch (e) {
                lastError = e;
                if (TRACE_ENABLED) {
                    trace(
                        'Failed to decode function call using signature %s with exact size match of %d bytes',
                        computeSignature(abi),
                        length
                    );
                }
            }
        }
    }
    // Consider dynamic data types
    for (const [abi, { length, exact }] of abisWithSize) {
        if (dataLength >= length && !exact) {
            try {
                return decodeFunctionCall(data, abi, computeSignature(abi), anonymous, reconcileStructShapeFromTuples);
            } catch (e) {
                lastError = e;
                if (TRACE_ENABLED) {
                    trace(
                        'Failed to decode function call using signature %s with size match of %d bytes (min size %d bytes)',
                        computeSignature(abi),
                        dataLength,
                        length
                    );
                }
            }
        }
    }
    // Brute-force try all ABI signatures, use the first one that doesn't throw on decode
    for (const abi of abis) {
        try {
            return decodeFunctionCall(data, abi, computeSignature(abi), anonymous, reconcileStructShapeFromTuples);
        } catch (e) {
            lastError = e;
        }
    }

    throw lastError ?? new Error('Unable to decode');
}

export function decodeLogEvent(
    data: string,
    topics: string[],
    abi: AbiItemDefinition,
    signature: string,
    anonymous: boolean,
    shouldReconcileStructs: boolean = false
): DecodedLogEvent {
    const nonIndexedInputs = abi.inputs.filter(i => !i.indexed);
    const nonIndexedTypes = nonIndexedInputs.map(encodeInputType);
    let decodedData: Array<Value | DecodedStruct> = abiDecodeParameters(data.slice(2), nonIndexedTypes);
    if (shouldReconcileStructs) {
        decodedData = reconcileStructs(decodedData as Value[], nonIndexedInputs);
    }
    let topicIndex = 1;
    let dataIndex = 0;
    const args: { [k: string]: Value | DecodedStruct } = {};
    const params = abi.inputs.map(input => {
        let value;
        if (input.indexed) {
            if (isArrayType(input.type)) {
                topicIndex++;
                // we can't decode arrays since there is only a hash the log
                value = [] as string[];
            } else {
                const rawValue = topics[topicIndex++];
                if (rawValue == null) {
                    throw new Error(
                        `Expected data in topic index=${topicIndex - 1}, but topics length is ${topics.length}`
                    );
                }

                const [decoded] = abiDecodeParameters(rawValue.slice(2), [encodeInputType(input)]);
                value = decoded;
                if (shouldReconcileStructs && isTuple(input)) {
                    const reconciled = reconcileStructFromDecodedTuple(decoded as Value[], input);
                    if (reconciled != null) {
                        value = reconciled;
                    }
                }
            }
        } else {
            value = decodedData[dataIndex++];
        }

        args[input.name] = value;
        return {
            name: anonymous ? undefined : input.name,
            type: input.type,
            value,
        };
    });
    return {
        name: abi.name,
        signature,
        params,
        args: anonymous ? undefined : args,
    };
}

export function decodeBestMatchingLogEvent(
    data: string,
    topics: string[],
    abis: AbiItemDefinition[],
    anonymous: boolean,
    reconcileStructShapeFromTuples: boolean
): DecodedFunctionCall {
    // No need to prioritize and check event logs for hash collisions since with the longer hash
    // collisions are very unlikely
    let lastError: Error | undefined;
    for (const abi of abis) {
        try {
            return decodeLogEvent(data, topics, abi, computeSignature(abi), anonymous, reconcileStructShapeFromTuples);
        } catch (e) {
            lastError = e;
            if (TRACE_ENABLED) {
                trace('Failed to decode log event', e);
            }
        }
    }
    throw lastError ?? new Error('Unable to decode log event');
}
