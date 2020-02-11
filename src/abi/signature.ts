import { sha3, AbiInput } from 'web3-utils';
import { AbiItemDefinition } from './item';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parseSignature: parse } = require('ethers/utils/abi-coder');

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

const normalizeInput = (input: any): AbiInput =>
    ({
        type: input.type ?? err('Failed to decode signature'),
        components: Array.isArray(input.components) ? input.components.map(normalizeInput) : undefined,
    } as AbiInput);

export function parseSignature(signature: string, type: 'function' | 'event'): AbiItemDefinition {
    const res = parse(signature) as any;
    const name: string = res.name ?? err('Failed to decode signature');
    if (!Array.isArray(res.inputs)) {
        err('Failed to decode signature');
    }
    const inputs: AbiInput[] = res.inputs.map(normalizeInput);
    return {
        type,
        name,
        inputs,
    };
}

export function computeSignatureHash(sigName: string, type: 'event' | 'function'): string {
    const hash = sha3(sigName);
    return type === 'event' ? hash.slice(2) : hash.slice(2, 10);
}

export function validateSignature(signature: string) {
    const parsed = parseSignature(signature, 'function');
    const serialized = computeSignature(parsed);
    if (serialized !== signature) {
        throw new Error(`Serialized signature does not match original`);
    }
}
