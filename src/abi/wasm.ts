import { AbiItem } from 'web3-utils';
import {
    abi_decode_parameters,
    get_data_size,
    init,
    is_array_type,
    is_valid_param_type,
    parse_event_signature,
    parse_function_signature,
    sha3 as wasm_sha3,
    to_checksum_address,
} from '../../wasm/ethabi/pkg';
import { memory } from '../../wasm/ethabi/pkg/ethlogger_ethabi_bg';
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

class EthAbiError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

function unwrapJsResult<T>(result: any): T {
    if (result.t === 'Ok') {
        return result.c as T;
    } else if (result.t === 'Err') {
        throw new EthAbiError(result.c);
    } else {
        throw new EthAbiError('Unexpected return value from wasm module');
    }
}

export function abiDecodeParameters(input: string, types: AbiType[]): Value[] {
    ensureInitialized();
    const data = new Uint8Array(Buffer.from(input, 'hex'));
    return unwrapJsResult(abi_decode_parameters(data, types));
}

export function parseFunctionSignature(signature: string): AbiItem {
    ensureInitialized();
    const result = unwrapJsResult(parse_function_signature(signature)) as Object;
    return { type: 'function', ...result };
}

export function parseEventSignature(signature: string): AbiItem {
    ensureInitialized();
    const result = unwrapJsResult(parse_event_signature(signature)) as Object;
    return { type: 'event', ...result };
}

export function isValidDataType(dataType: string): boolean {
    ensureInitialized();
    return is_valid_param_type(dataType);
}

export function isArrayType(dataType: string): boolean {
    ensureInitialized();
    return unwrapJsResult(is_array_type(dataType));
}

export function getDataSize(dataType: string): { length: number; exact: boolean } {
    ensureInitialized();
    return unwrapJsResult(get_data_size(dataType));
}

export function sha3(str: string): string | null {
    ensureInitialized();
    return wasm_sha3(str) ?? null;
}

export function toChecksumAddress(address: string): string {
    ensureInitialized();
    return unwrapJsResult(to_checksum_address(address));
}

export function getWasmMemorySize(): number {
    return memory.buffer.byteLength;
}
