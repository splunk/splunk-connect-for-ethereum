import {
    checkDynamicArrayType,
    checkFixedSizeArrayType,
    elementType,
    getDataSize,
    intBits,
    isArrayType,
    isValidAbiType,
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
    expect(elementType('int[5][]')).toBe('int[5]');
    expect(elementType('int[5][12]')).toBe('int[5]');
    expect(() => elementType('int')).toThrow(/Invalid array type/);
});

test('intBits', () => {
    expect(intBits('uint256', 'uint')).toBe(256);
    expect(intBits('uint8', 'uint')).toBe(8);
    expect(intBits('int16', 'int')).toBe(16);
});

test('isValidAbiType', () => {
    expect(isValidAbiType('foo')).toBe(false);
    expect(isValidAbiType('uint256[]')).toBe(true);
    expect(isValidAbiType('uint256[1]')).toBe(true);
    expect(isValidAbiType('uint256[][1]')).toBe(true);
    expect(isValidAbiType('uint8')).toBe(true);
    expect(isValidAbiType('uint8[32][]')).toBe(true);
    expect(isValidAbiType('byte[0]')).toBe(false);
    expect(isValidAbiType('uint13')).toBe(false);
    expect(isValidAbiType('uint16')).toBe(true);
    expect(isValidAbiType('int10000')).toBe(false);
    expect(isValidAbiType('string')).toBe(true);
    expect(isValidAbiType('function')).toBe(true);
    expect(isValidAbiType('bytes')).toBe(true);
    expect(isValidAbiType('string[]')).toBe(false);
});

test('getDataSize', () => {
    expect(getDataSize('int32')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect(getDataSize('uint256[]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect(getDataSize('uint256[1]')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect(getDataSize('uint256[][1]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect(getDataSize('uint8[1][]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect(getDataSize('uint16')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect(getDataSize('string')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect(getDataSize('function')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect(getDataSize('bytes')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);

    expect(() => getDataSize('foo')).toThrowErrorMatchingInlineSnapshot(`"Invalid ABI data type: foo"`);
    expect(() => getDataSize('uint13')).toThrowErrorMatchingInlineSnapshot(`"Invalid ABI data type: uint13"`);
    expect(() => getDataSize('int10000')).toThrowErrorMatchingInlineSnapshot(`"Invalid ABI data type: int10000"`);
    expect(() => getDataSize('string[]')).toThrowErrorMatchingInlineSnapshot(`"Type string cannot be in an array"`);
    expect(() => getDataSize('bytes[]')).toThrowErrorMatchingInlineSnapshot(`"Type bytes cannot be in an array"`);
});
