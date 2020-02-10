import { AbiCoder } from 'web3-eth-abi';
import { toChecksumAddress } from 'web3-utils';
import { parseBigInt } from '../utils/bn';
import { AbiItemDefinition } from './item';
import { elementType, intBits, isArrayType } from './datatypes';

export type ScalarValue = string | number | boolean;
export type Value = ScalarValue | ScalarValue[];

export interface DecodedParameter {
    name?: string;
    type: string;
    value: Value;
}

export interface DecodedFunctionCall {
    name: string;
    signature: string;
    params: DecodedParameter[];
    args?: { [name: string]: Value };
}

export interface DecodedLogEvent {
    name: string;
    signature: string;
    params: DecodedParameter[];
    args?: { [name: string]: Value };
}

export function parseParameterValue(value: string | number | boolean, type: string): ScalarValue {
    if (type === 'bool') {
        if (typeof value === 'boolean') {
            return value;
        }
        switch (value) {
            case '1':
                return true;
            case '0':
                return false;
            default:
                throw new Error(`Invalid boolean value: ${value}`);
        }
    }
    if (type.startsWith('uint')) {
        if (intBits(type, 'uint') <= 53) {
            return parseInt(value as string, 10);
        } else {
            return parseBigInt(value as string);
        }
    }

    if (type.startsWith('int')) {
        if (typeof value === 'number') {
            return value;
        }
        if (intBits(type, 'int') <= 53) {
            return parseInt(value as string, 10);
        } else {
            return parseBigInt(value as string);
        }
    }

    if (type === 'address') {
        return toChecksumAddress(value as string);
    }

    return value;
}

export function decodeFunctionCall(
    data: string,
    abi: AbiItemDefinition,
    signature: string,
    abiCoder: AbiCoder,
    anonymous: boolean
): DecodedFunctionCall {
    const inputs = abi.inputs ?? [];
    const decodedParams = abiCoder.decodeParameters(
        inputs.map(i => i.type),
        data.slice(10)
    );
    const params: DecodedParameter[] = [];
    const args: { [name: string]: string | number | boolean | Array<string | number | boolean> } = {};

    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const rawValue = decodedParams[i];
        const value = isArrayType(input.type)
            ? (rawValue as string[]).map(v => parseParameterValue(v, elementType(input.type)))
            : parseParameterValue(rawValue, input.type);
        args[input.name!] = value;
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

export function decodeLogEvent(
    data: string,
    topics: string[],
    abi: AbiItemDefinition,
    signature: string,
    abiCoder: AbiCoder,
    anonymous: boolean
): DecodedLogEvent {
    const nonIndexedTypes = abi.inputs.filter(i => !i.indexed).map(i => i.type);
    const decodedData = abiCoder.decodeParameters(nonIndexedTypes, data.slice(2));
    let topicIndex = 1;
    let dataIndex = 0;
    const args: { [k: string]: Value } = {};
    const params = abi.inputs.map(input => {
        let value;
        if (input.indexed) {
            if (isArrayType(input.type)) {
                topicIndex++;
                // we can't decode arrays since there is only a hash the log
                value = [] as string[];
            } else {
                let rawValue = topics[topicIndex++];
                if (input.type === 'address') {
                    rawValue = '0x' + rawValue.slice(-40);
                }
                value = parseParameterValue(rawValue, input.type);
            }
        } else {
            const rawValue = decodedData[dataIndex++];
            value = isArrayType(input.type)
                ? (rawValue as string[]).map(v => parseParameterValue(v, elementType(input.type)))
                : parseParameterValue(rawValue, input.type);
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
