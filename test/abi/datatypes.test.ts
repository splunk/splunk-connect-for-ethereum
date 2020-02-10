import {
    intBits,
    checkDynamicArrayType,
    checkFixedSizeArrayType,
    isArrayType,
    elementType,
} from '../../src/abi/datatypes';

test('checkDynamicArrayType', () => {
    expect(checkDynamicArrayType('address')).toEqual([false, undefined]);
    expect(checkDynamicArrayType('uint256[5]')).toEqual([false, undefined]);
    expect(checkDynamicArrayType('uint256[]')).toEqual([true, 'uint256']);
});

test('checkFixedSizeArrayType', () => {
    expect(checkFixedSizeArrayType('int64[100]')).toEqual([true, 'int64', 100]);
    expect(checkFixedSizeArrayType('int64[]')).toEqual([false, undefined, undefined]);
    expect(checkFixedSizeArrayType('int64')).toEqual([false, undefined, undefined]);
    expect(checkFixedSizeArrayType('int64]')).toEqual([false, undefined, undefined]);
});

test('isArrayType', () => {
    expect(isArrayType('int[]')).toBe(true);
    expect(isArrayType('int[5]')).toBe(true);
    expect(isArrayType('int')).toBe(false);
});

test('elementType', () => {
    expect(elementType('int[]')).toBe('int');
    expect(elementType('int[5]')).toBe('int');
    expect(() => elementType('int')).toThrow(/Invalid array type/);
});

test('intBits', () => {
    expect(intBits('uint256', 'uint')).toBe(256);
    expect(intBits('uint8', 'uint')).toBe(8);
    expect(intBits('int16', 'int')).toBe(16);
});
