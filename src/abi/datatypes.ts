import { getDataSize as wasmGetDataSize, isArrayType as wasmIsArrayType, isValidDataType } from './wasm';

export type AbiType = string;

export function isValidAbiType(typeStr: string): typeStr is AbiType {
    if (!typeStr) {
        return false;
    }
    return isValidDataType(typeStr);
}

export function isArrayType(type: AbiType): boolean {
    return wasmIsArrayType(type);
}

export interface DataSize {
    length: number;
    /** `false` if a variable-size data type. `length` is the minimum size in this case */
    exact: boolean;
}

export function getDataSize(typeStr: AbiType): DataSize {
    return wasmGetDataSize(typeStr) as any;
}
