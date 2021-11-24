import { RuntimeError } from '../utils/error';
import { AbiInput, AbiOutput } from './item';
import { getDataSize as wasmGetDataSize, isArrayType as wasmIsArrayType, isValidDataType } from './wasm';

export type AbiType = string;

export class DataTypeError extends RuntimeError {}

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

export const isTupleArray = (inputDef: AbiInput) => inputDef.type === 'tuple[]';
export const isTuple = (inputDef: AbiInput) => inputDef.type === 'tuple' || isTupleArray(inputDef);

export function encodeInputType(inputDef: AbiInput): string {
    if (isTuple(inputDef)) {
        if (!inputDef.components?.length) {
            throw new DataTypeError('Unable to encode tuple datatype without components');
        }
        const serializedComponentTypes = inputDef.components.map(c => encodeInputType(c)).join(',');
        const serializedType = `(${serializedComponentTypes})`;
        return isTupleArray(inputDef) ? `${serializedType}[]` : serializedType;
    }
    return inputDef.type;
}

export function encodeOutputType(outputDef: AbiOutput): string {
    if (isTuple(outputDef)) {
        if (!outputDef.components?.length) {
            throw new DataTypeError('Unable to encode tuple datatype without components');
        }
        const serializedComponentTypes = outputDef.components.map(c => encodeOutputType(c)).join(',');
        const serializedType = `(${serializedComponentTypes})`;
        return isTupleArray(outputDef) ? `${serializedType}[]` : serializedType;
    }
    return outputDef.type;
}
