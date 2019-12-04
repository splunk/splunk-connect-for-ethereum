import { AbiDecoder, intBits, decodeParameterValue, computeSignature, computeSignatureName } from '../src/abi';
import { join } from 'path';

test('AbiDecoder#decodeMethod', async () => {
    const abiDecoder = new AbiDecoder();

    await expect(abiDecoder.loadAbiDir(join(__dirname, 'abi'))).resolves.toBeUndefined();

    expect(abiDecoder.signatureCount).toMatchInlineSnapshot(`30`);

    const res1 = abiDecoder.decodeMethod(
        `0x23b872dd000000000000000000000000bcbccc14595f6050f83212ddc2c06c2527269ccb0000000000000000000000000e88984287591fc5ef79fe1374e9b86fdd372bcb0000000000000000000000000000000000000000000000000000000000005d35`
    );
    expect(res1).toMatchInlineSnapshot(`
        Object {
          "args": Object {
            "amount": 23861,
            "recipient": "0x0e88984287591FC5EF79fE1374E9b86fDd372bcb",
            "sender": "0xbCbcCC14595f6050f83212dDc2C06C2527269Ccb",
          },
          "name": "transferFrom",
          "params": Array [
            Object {
              "name": "sender",
              "type": "address",
              "value": "0xbCbcCC14595f6050f83212dDc2C06C2527269Ccb",
            },
            Object {
              "name": "recipient",
              "type": "address",
              "value": "0x0e88984287591FC5EF79fE1374E9b86fDd372bcb",
            },
            Object {
              "name": "amount",
              "type": "uint256",
              "value": 23861,
            },
          ],
        }
    `);

    const res2 = abiDecoder.decodeMethod(
        `0xa22cb4650000000000000000000000007c77f845f9c9c0d0c0f422a072787db0582a729a0000000000000000000000000000000000000000000000000000000000000001`,
        'da148233860cf79ce56829590f280ed40af82bb19d8d3e3bcdaa97f008b8475f'
    );
    expect(res2).toMatchInlineSnapshot(`
        Object {
          "args": Object {
            "_approved": true,
            "operator": "0x7c77F845F9c9C0d0C0F422A072787db0582a729a",
          },
          "name": "setApprovalForAll",
          "params": Array [
            Object {
              "name": "operator",
              "type": "address",
              "value": "0x7c77F845F9c9C0d0C0F422A072787db0582a729a",
            },
            Object {
              "name": "_approved",
              "type": "bool",
              "value": true,
            },
          ],
        }
    `);
});

test('intBits', () => {
    expect(intBits('uint256', 'uint')).toBe(256);
    expect(intBits('uint8', 'uint')).toBe(8);
    expect(intBits('int16', 'int')).toBe(16);
});

test('decodeParameterValue', () => {
    expect(decodeParameterValue('123', 'uint256')).toBe(123);
    expect(decodeParameterValue('6581651658165165165156132198465165168', 'uint256')).toBe(
        '6581651658165165165156132198465165168'
    );
});

test('computeSignature', () => {
    expect(
        computeSignature(
            computeSignatureName({
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
        computeSignature(
            computeSignatureName({
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
