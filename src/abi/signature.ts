import { isValidAbiType } from './datatypes';
import { AbiInput, AbiItemDefinition } from './item';
import { parseEventSignature, parseFunctionSignature, sha3 } from './wasm';

const err = (msg: string): never => {
    throw new Error(msg);
};

export const encodeParam = (input: AbiInput): string =>
    input.type === 'tuple'
        ? `(${input.components?.map(encodeParam) ?? err('Failed to encode tuple without components')})`
        : input.type;

export function computeSignature(abi: AbiItemDefinition) {
    if (abi.name == null) {
        throw new Error('Cannot add ABI item without name');
    }
    return `${abi.name}(${(abi.inputs ?? []).map(encodeParam).join(',')})`;
}

export const encodeParamWithIndexedFlag = (input: AbiInput): string =>
    input.indexed ? `${encodeParam(input)} indexed` : encodeParam(input);

export function serializeEventSignature(abi: AbiItemDefinition): string {
    if (abi.name == null) {
        throw new Error('Cannot add ABI item without name');
    }
    return `${abi.name}(${(abi.inputs ?? []).map(encodeParamWithIndexedFlag).join(',')})`;
}

export function parseSignature(signature: string, type: 'function' | 'event'): AbiItemDefinition {
    return (type === 'event' ? parseEventSignature(signature) : parseFunctionSignature(signature)) as any;
}

export function computeSignatureHash(signature: string, type: 'event' | 'function'): string {
    const hash = sha3(signature);
    if (hash == null) {
        throw new Error(`NULL signature hash for signature ${signature}`);
    }
    return type === 'event' ? hash.slice(2) : hash.slice(2, 10);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateSignature(signature: string, type: 'event' | 'function') {
    const parsed = parseSignature(signature, 'event');
    for (const input of parsed.inputs) {
        if (!isValidAbiType(input.type)) {
            throw new Error(`Invalid data type: ${input.type}`);
        }
    }
    computeSignature(parsed);
    // if (serialized !== signature) {
    //     throw new Error(`Serialized signature does not match original`);
    // }
}
