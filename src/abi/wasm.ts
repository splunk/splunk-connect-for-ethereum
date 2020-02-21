import { abi_decode_parameters, init } from '../../wasm/ethabi/pkg';
import { createModuleDebug } from '../utils/debug';
import { AbiType } from './datatypes';

const { trace } = createModuleDebug('abi:decode');

export type ScalarValue = string | number | boolean;
export type Value = ScalarValue | ScalarValue[];

let initialized = false;

export function abiDecodeParameters(input: string, types: AbiType[]): Value[] {
    if (!initialized) {
        trace('Initializing WASM module');
        init();
        initialized = true;
    }
    const data = new Uint8Array(Buffer.from(input, 'hex'));
    return abi_decode_parameters(data, types);
}
