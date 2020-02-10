import { computeSignature, computeSignatureHash, parseSignature } from '../../src/abi/signature';

describe('parseSignature', () => {
    // it('parses all function signatures', async () => {
    //     const rl = readline.createInterface(createReadStream(join(__dirname, '../../data/function_signatures.txt')));
    //     for await (const line of rl) {
    //         const parsed = parseSignature(line, 'function');
    //         expect(computeSignature(parsed)).toEqual(line);
    //     }
    // });
    expect(parseSignature('Hello(uint256)', 'function')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "components": undefined,
              "type": "uint256",
            },
          ],
          "name": "Hello",
          "type": "function",
        }
    `);

    expect(parseSignature('batchCancelOrders(address[5])', 'function')).toMatchInlineSnapshot(`
        Object {
          "inputs": Array [
            Object {
              "components": undefined,
              "type": "address[5]",
            },
          ],
          "name": "batchCancelOrders",
          "type": "function",
        }
    `);
});

test('computeSignature', () => {
    expect(
        computeSignatureHash(
            computeSignature({
                inputs: [
                    {
                        indexed: true,
                        name: 'owner',
                        type: 'address',
                    },
                    {
                        indexed: true,
                        name: 'operator',
                        type: 'address',
                    },
                    {
                        indexed: false,
                        name: 'approved',
                        type: 'bool',
                    },
                ],
                name: 'ApprovalForAll',
                type: 'event',
            }),
            'event'
        )
    ).toMatchInlineSnapshot(`"17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"`);
    expect(
        computeSignatureHash(
            computeSignature({
                inputs: [
                    {
                        name: 'operator',
                        type: 'address',
                    },
                    {
                        name: '_approved',
                        type: 'bool',
                    },
                ],
                name: 'setApprovalForAll',
                type: 'function',
            }),
            'function'
        )
    ).toMatchInlineSnapshot(`"a22cb465"`);
});
