import { RuntimeError } from '../utils/error';
import { encodeInputType, isValidAbiType } from './datatypes';
import { AbiInput, AbiItemDefinition } from './item';
import { parseEventSignature, parseFunctionSignature, sha3 } from './wasm';

class InvalidSignatureError extends RuntimeError {}

export function computeSignature(abi: AbiItemDefinition) {
    if (abi.name == null) {
        throw new InvalidSignatureError('Cannot serialize ABI definition without name');
    }
    return `${abi.name}(${(abi.inputs ?? []).map(encodeInputType).join(',')})`;
}

export const encodeParamWithIndexedFlag = (input: AbiInput): string =>
    input.indexed ? `${encodeInputType(input)} indexed` : encodeInputType(input);

export function serializeEventSignature(abi: AbiItemDefinition): string {
    if (abi.name == null) {
        throw new InvalidSignatureError('Cannot serialize ABI event definition without name');
    }
    return `${abi.name}(${(abi.inputs ?? []).map(encodeParamWithIndexedFlag).join(',')})`;
}

export function parseSignature(signature: string, type: 'function' | 'event'): AbiItemDefinition {
    return (type === 'event' ? parseEventSignature(signature) : parseFunctionSignature(signature)) as any;
}

export function computeSignatureHash(signature: string, type: 'event' | 'function'): string {
    const hash = sha3(signature);
    if (hash == null) {
        throw new InvalidSignatureError(`NULL signature hash for signature ${signature}`);
    }
    return type === 'event' ? hash.slice(2) : hash.slice(2, 10);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateSignature(signature: string, type: 'event' | 'function') {
    const parsed = parseSignature(signature, type);
    for (const input of parsed.inputs) {
        if (!isValidAbiType(input.type)) {
            throw new InvalidSignatureError(`Invalid data type: ${input.type}`);
        }
    }
    const serialized = computeSignature(parsed);
    if (type !== 'event' && serialized !== signature) {
        throw new InvalidSignatureError(`Serialized function signature does not match original`);
    }
}
