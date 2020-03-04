import { AbiItem } from 'web3-utils';
import {
    abi_decode_parameters,
    get_canonical_type,
    get_data_size,
    init,
    is_valid_param_type,
    parse_event_signature,
    parse_function_signature,
    is_array_type,
} from '../../wasm/ethabi/pkg';
import { createModuleDebug } from '../utils/debug';
import { AbiType } from './datatypes';

const { trace } = createModuleDebug('abi:decode');

export type ScalarValue = string | number | boolean;
export type Value = ScalarValue | ScalarValue[];

let initialized = false;

function ensureInitialized() {
    if (!initialized) {
        trace('Initializing WASM module');
        init();
        initialized = true;
    }
}

export function abiDecodeParameters(input: string, types: AbiType[]): Value[] {
    ensureInitialized();
    const data = new Uint8Array(Buffer.from(input, 'hex'));
    try {
        return abi_decode_parameters(data, types);
    } catch (e) {
        if (typeof e === 'string') {
            throw new Error(e);
        }
        throw e;
    }
}

export function parseFunctionSignature(signature: string): AbiItem {
    ensureInitialized();
    try {
        const result = parse_function_signature(signature);
        return { type: 'function', ...result };
    } catch (e) {
        if (typeof e === 'string') {
            throw new Error(e);
        }
        throw e;
    }
}

export function parseEventSignature(signature: string): AbiItem {
    ensureInitialized();
    try {
        const result = parse_event_signature(signature);
        return { type: 'event', ...result };
    } catch (e) {
        if (typeof e === 'string') {
            throw new Error(e);
        }
        throw e;
    }
}

export function isValidDataType(dataType: string): boolean {
    ensureInitialized();
    return is_valid_param_type(dataType);
}

export function isArrayType(dataType: string): boolean {
    ensureInitialized();
    return is_array_type(dataType);
}

export function getCanonicalDataType(dataType: string): string {
    ensureInitialized();
    try {
        return get_canonical_type(dataType);
    } catch (e) {
        if (typeof e === 'string') {
            throw new Error(e);
        }
        throw e;
    }
}

export function getDataSize(dataType: string): { length: number; exact: boolean } {
    ensureInitialized();
    try {
        return get_data_size(dataType);
    } catch (e) {
        if (typeof e === 'string') {
            throw new Error(e);
        }
        throw e;
    }
}
