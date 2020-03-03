import { getDataSize, isValidAbiType } from '../../src/abi/datatypes';

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
    expect(isValidAbiType('function')).toBe(false);
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
    expect(getDataSize('bytes')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);

    expect(() => getDataSize('foo')).toThrowErrorMatchingInlineSnapshot(`"Invalid name \`foo\`"`);
    expect(() => getDataSize('uint13')).toThrowErrorMatchingInlineSnapshot(`"Invalid type: uint13"`);
    expect(() => getDataSize('int10000')).toThrowErrorMatchingInlineSnapshot(`"Invalid type: int10000"`);
    expect(() => getDataSize('string[]')).toThrowErrorMatchingInlineSnapshot(`"Invalid type: string[]"`);
    expect(() => getDataSize('bytes[]')).toThrowErrorMatchingInlineSnapshot(`"Invalid type: bytes[]"`);
});
