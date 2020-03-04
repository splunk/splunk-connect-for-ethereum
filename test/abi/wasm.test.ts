import { parseFunctionSignature, isValidDataType, getCanonicalDataType, getDataSize, sha3 } from '../../src/abi/wasm';
import { sha3 as w3sha3 } from 'web3-utils';

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

test('sha3', () => {
    expect(sha3('foo')).toMatchInlineSnapshot(`"0x41b1a0649752af1b28b3dc29a1556eee781e4a4c3a1f7f53f90fa834de098c4d"`);
    expect(w3sha3('foo')).toMatchInlineSnapshot(`"0x41b1a0649752af1b28b3dc29a1556eee781e4a4c3a1f7f53f90fa834de098c4d"`);

    expect(sha3('')).toMatchInlineSnapshot(`null`);
    expect(w3sha3('')).toMatchInlineSnapshot(`null`);

    expect(sha3('0x12')).toMatchInlineSnapshot(`"0x5fa2358263196dbbf23d1ca7a509451f7a2f64c15837bfbb81298b1e3e24e4fa"`);
    expect(w3sha3('0x12')).toMatchInlineSnapshot(
        `"0x5fa2358263196dbbf23d1ca7a509451f7a2f64c15837bfbb81298b1e3e24e4fa"`
    );
    expect(sha3('0x123')).toMatchInlineSnapshot(`"0x4a4613b6024d34a6aac825a96e99f1480be5fc28f4cfe736fbaad0457f5ba1e5"`);
    expect(w3sha3('0x123')).toMatchInlineSnapshot(
        `"0xa88f8e91cf68fe19e866af1b030951f8b93ddba9e26fa7f5f6c45a5faeb1cdd2"`
    );
    expect(sha3('0x123z')).toMatchInlineSnapshot(
        `"0xea7d953054ed3082a5213c6e79bc8f76c7cdfed74690fc45ce903e2c9401e3a9"`
    );
    expect(w3sha3('0x123z')).toMatchInlineSnapshot(
        `"0xa88f8e91cf68fe19e866af1b030951f8b93ddba9e26fa7f5f6c45a5faeb1cdd2"`
    );
});