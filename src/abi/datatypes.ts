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
        const start = typeStr.indexOf('[');
        const size = parseInt(typeStr.slice(start + 1, -1), 10);
        if (start > -1 && !isNaN(size)) {
            return [true, typeStr.slice(0, start), size];
        }
    }
    return [false, undefined, undefined];
};

export function isValidAbiType(typeStr: string): typeStr is AbiType {
    if (!typeStr) {
        return false;
    }
    const [isDynamicArray, dynamicArrayBaseType] = checkDynamicArrayType(typeStr);
    if (isDynamicArray) {
        return isValidAbiType(dynamicArrayBaseType!);
    }
    const [isFixedSizeArray, fixedSizedArrayType, size] = checkFixedSizeArrayType(typeStr);
    if (isFixedSizeArray) {
        return isValidAbiType(fixedSizedArrayType!) && size! > 0;
    }
    switch (typeStr) {
        case 'bool':
        case 'address':
        case 'int':
        case 'uint':
        case 'fixed':
        case 'ufixed':
        case 'function':
        case 'bytes':
        case 'string':
            return true;
        default:
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
