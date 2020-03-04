import { parseFunctionSignature, isValidDataType, getCanonicalDataType, getDataSize } from '../../src/abi/wasm';

// test.only('failures', () => {
//     expect(parseFunctionSignature(`evaluateConsent((int32)))`)).toMatchInlineSnapshot(`
//         Object {
//           "inputs": Array [],
//           "name": "evaluateConsent",
//           "type": "function",
//         }
//     `);
// });

test('parseSignature', () => {
    expect(parseFunctionSignature('Hello(uint256)')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "type": "uint256",
            },
          ],
          "name": "Hello",
          "type": "function",
        }
    `);
    expect(parseFunctionSignature('Hello(bytes[32],address,(uint,int16))')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "type": "bytes[32]",
            },
            Object {
              "type": "address",
            },
            Object {
              "components": Array [
                Object {
                  "type": "uint256",
                },
                Object {
                  "type": "int16",
                },
              ],
              "type": "tuple",
            },
          ],
          "name": "Hello",
          "type": "function",
        }
    `);
    expect(parseFunctionSignature('Hello()')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [],
          "name": "Hello",
          "type": "function",
        }
    `);

    expect(() => parseFunctionSignature('foo')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: no open parentesis found"`
    );
    expect(() => parseFunctionSignature('')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: no open parentesis found"`
    );
    expect(() => parseFunctionSignature('foo(blah)')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Invalid name \`blah\`"`
    );
    expect(() => parseFunctionSignature('foo(blah int)')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Invalid name \`blah int\`"`
    );
    expect(() => parseFunctionSignature('foo(int blah)')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Integer parsing error: invalid digit found in string"`
    );
    expect(() => parseFunctionSignature('foo(int')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Invalid argument list"`
    );
    expect(() => parseFunctionSignature('foo(int)(uint)')).toThrowErrorMatchingInlineSnapshot(
        `"Unbalanced parenthesis"`
    );
    expect(() => parseFunctionSignature('foo(int)uint')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Invalid argument list"`
    );
    expect(() => parseFunctionSignature('foo bar (int)')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Invalid function name: \\"foo bar \\""`
    );
    expect(() => parseFunctionSignature('()')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Empty function name"`
    );
    expect(() => parseFunctionSignature('test(uint27)')).toThrowErrorMatchingInlineSnapshot(
        `"Unable to parse signature: Invalid type: uint27"`
    );
    expect(() => parseFunctionSignature('test(int,)')).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected end of argument list"`
    );
});

test('isValidDataType', () => {
    expect(isValidDataType('int')).toBe(true);
    expect(isValidDataType('int64[100]')).toBe(true);
    expect(isValidDataType('foo')).toBe(false);
    expect(isValidDataType('int27')).toBe(false);
    expect(isValidDataType('int27[]')).toBe(false);
    expect(isValidDataType('int32[]')).toBe(true);
    expect(isValidDataType('(int32,bool)')).toBe(true);
    expect(isValidDataType('(int27,bool)')).toBe(false);
});

test('getCanonicalDataType', () => {
    expect(getCanonicalDataType('uint')).toMatchInlineSnapshot(`"uint256"`);
    expect(getCanonicalDataType('int[]')).toMatchInlineSnapshot(`"int256[]"`);
});

test('getDataSize', () => {
    expect(getDataSize('uint')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 32,
        }
    `);
    expect(getDataSize('int[]')).toMatchInlineSnapshot(`
        Object {
          "exact": false,
          "length": 64,
        }
    `);
    expect(getDataSize('(address,address,bytes32)')).toMatchInlineSnapshot(`
        Object {
          "exact": true,
          "length": 96,
        }
    `);
});
