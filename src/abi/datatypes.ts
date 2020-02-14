export type AbiType = string;

export const intBits = (type: string, baseType: 'uint' | 'int'): number => +type.slice(baseType.length);

export const fixedBits = (type: string, baseType: 'fixed' | 'ufixed'): [number, number] => {
    const [mstr, nstr] = type.slice(baseType.length).split('x');
    return [parseInt(mstr, 10), parseInt(nstr, 10)];
};

export const checkDynamicArrayType = (typeStr: string): [true, string] | [false, undefined] =>
    typeStr.endsWith('[]') ? [true, typeStr.slice(0, -2)] : [false, undefined];

export const checkFixedSizeArrayType = (typeStr: string): [true, string, number] | [false, undefined, undefined] => {
    if (typeStr.endsWith(']')) {
        const start = typeStr.lastIndexOf('[');
        const size = parseInt(typeStr.slice(start + 1, -1), 10);
        if (start > -1 && !isNaN(size)) {
            return [true, typeStr.slice(0, start), size];
        }
    }
    return [false, undefined, undefined];
};

export function isValidAbiType(typeStr: string, isArrayType: boolean = false): typeStr is AbiType {
    if (!typeStr) {
        return false;
    }
    const [isDynamicArray, dynamicArrayBaseType] = checkDynamicArrayType(typeStr);
    if (isDynamicArray) {
        return isValidAbiType(dynamicArrayBaseType!, true);
    }
    const [isFixedSizeArray, fixedSizedArrayType, size] = checkFixedSizeArrayType(typeStr);
    if (isFixedSizeArray) {
        return isValidAbiType(fixedSizedArrayType!, true) && size! > 0;
    }
    switch (typeStr) {
        case 'bool':
        case 'address':
        case 'int':
        case 'uint':
        case 'fixed':
        case 'ufixed':
        case 'function':
            return true;
        case 'bytes':
        case 'string':
            return !isArrayType;
        default:
            if (typeStr.startsWith('bytes')) {
                const bytes = +typeStr.slice('bytes'.length);
                return !isNaN(bytes) && bytes > 0 && bytes <= 32;
            }
            for (const intType of ['int', 'uint']) {
                if (typeStr.startsWith(intType)) {
                    const bits = intBits(typeStr, intType as 'int' | 'uint');
                    return !isNaN(bits) && bits > 0 && bits <= 256 && bits % 8 === 0;
                }
            }
            for (const fixedType of ['fixed', 'ufixed']) {
                if (typeStr.startsWith(fixedType)) {
                    const [m, n] = fixedBits(typeStr, fixedType as 'fixed' | 'ufixed');
                    return !isNaN(m) && !isNaN(n) && m >= 8 && m <= 256 && m % 8 === 0 && n >= 0 && n <= 80;
                }
            }
            return false;
    }
}

export function isArrayType(type: AbiType): boolean {
    return checkDynamicArrayType(type)[0] || checkFixedSizeArrayType(type)[0];
}

export function elementType(type: AbiType): AbiType {
    const [isDynamic, dynElementType] = checkDynamicArrayType(type);
    if (isDynamic) {
        return dynElementType!;
    }
    const [isFixed, fixedType] = checkFixedSizeArrayType(type);
    if (isFixed) {
        return fixedType!;
    }
    throw new Error(`Invalid array type: ${type}`);
}

export interface DataSize {
    length: number;
    /** `false` if a variable-size data type. `length` is the minimum size in this case */
    exact: boolean;
}

export function getDataSize(typeStr: AbiType, isArrayType: boolean = false): DataSize {
    if (!typeStr) {
        throw new Error(`Invalid ABI data type: ${typeStr}`);
    }
    const [isDynamicArray, dynamicArrayBaseType] = checkDynamicArrayType(typeStr);
    if (isDynamicArray) {
        getDataSize(dynamicArrayBaseType as AbiType, true);
        return {
            length: 64,
            exact: false,
        };
    }
    const [isFixedSizeArray, fixedSizedArrayType, size] = checkFixedSizeArrayType(typeStr);
    if (isFixedSizeArray) {
        const { length: elementSize, exact } = getDataSize(fixedSizedArrayType as AbiType, true);
        return { length: size! * elementSize, exact };
    }
    switch (typeStr) {
        case 'bool':
        case 'address':
        case 'int':
        case 'uint':
        case 'fixed':
        case 'ufixed':
        case 'function':
            return { length: 32, exact: true };
        case 'bytes':
        case 'string':
            if (isArrayType) {
                throw new Error(`Type ${typeStr} cannot be in an array`);
            }
            return { length: 64, exact: false };
        default:
            if (typeStr.startsWith('bytes')) {
                const bytes = +typeStr.slice('bytes'.length);
                if (!(!isNaN(bytes) && bytes > 0 && bytes <= 32)) {
                    throw new Error(`Invalid ABI data type: ${typeStr}`);
                } else {
                    return { length: 32, exact: true };
                }
            }
            for (const intType of ['int', 'uint']) {
                if (typeStr.startsWith(intType)) {
                    const bits = intBits(typeStr, intType as 'int' | 'uint');
                    if (!(!isNaN(bits) && bits > 0 && bits <= 256 && bits % 8 === 0)) {
                        throw new Error(`Invalid ABI data type: ${typeStr}`);
                    } else {
                        return { length: 32, exact: true };
                    }
                }
            }
            for (const fixedType of ['fixed', 'ufixed']) {
                if (typeStr.startsWith(fixedType)) {
                    const [m, n] = fixedBits(typeStr, fixedType as 'fixed' | 'ufixed');
                    if (!(!isNaN(m) && !isNaN(n) && m >= 8 && m <= 256 && m % 8 === 0 && n >= 0 && n <= 80)) {
                        throw new Error(`Invalid ABI data type: ${typeStr}`);
                    } else {
                        return { length: 32, exact: true };
                    }
                }
            }
            throw new Error(`Invalid ABI data type: ${typeStr}`);
    }
}
