import { join } from 'path';
import { AbiRepository } from '../../src/abi/repo';
import { suppressDebugLogging } from '../../src/utils/debug';

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

test('AbiRepository#decodeFunctionCall', async () => {
    const abiRepo = new AbiRepository({
        decodeAnonymous: true,
        fingerprintContracts: true,
        abiFileExtension: '.json',
        directory: join(__dirname, '../abis'),
        searchRecursive: true,
    });

    await abiRepo.initialize();

    expect(abiRepo.signatureCount).toBeGreaterThan(0);

    expect(
        abiRepo.decodeFunctionCall(
            `0x23b872dd000000000000000000000000bcbccc14595f6050f83212ddc2c06c2527269ccb0000000000000000000000000e88984287591fc5ef79fe1374e9b86fdd372bcb0000000000000000000000000000000000000000000000000000000000005d35`,
            { contractFingerprint: '30f0d1068a77a3aaa446f680f4aa961c9e981bff9aba4a0962230867d0f3ddf9' }
        )
    ).toMatchInlineSnapshot(`
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
          "signature": "transferFrom(address,address,uint256)",
        }
    `);

    expect(
        abiRepo.decodeFunctionCall(
            `0x23b872dd000000000000000000000000bcbccc14595f6050f83212ddc2c06c2527269ccb0000000000000000000000000e88984287591fc5ef79fe1374e9b86fdd372bcb0000000000000000000000000000000000000000000000000000000000005d35`,
            {}
        )
    ).toMatchInlineSnapshot(`
        Object {
          "args": undefined,
          "name": "transferFrom",
          "params": Array [
            Object {
              "name": undefined,
              "type": "address",
              "value": "0xbCbcCC14595f6050f83212dDc2C06C2527269Ccb",
            },
            Object {
              "name": undefined,
              "type": "address",
              "value": "0x0e88984287591FC5EF79fE1374E9b86fDd372bcb",
            },
            Object {
              "name": undefined,
              "type": "uint256",
              "value": 23861,
            },
          ],
          "signature": "transferFrom(address,address,uint256)",
        }
    `);

    expect(
        abiRepo.decodeFunctionCall(
            `0xa22cb4650000000000000000000000007c77f845f9c9c0d0c0f422a072787db0582a729a0000000000000000000000000000000000000000000000000000000000000001`,
            { contractFingerprint: 'da148233860cf79ce56829590f280ed40af82bb19d8d3e3bcdaa97f008b8475f' }
        )
    ).toMatchInlineSnapshot(`
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
          "signature": "setApprovalForAll(address,bool)",
        }
    `);
});

test('AbiRepository#decodeLogEvent', async () => {
    const abiRepo = new AbiRepository({
        decodeAnonymous: false,
        fingerprintContracts: true,
        abiFileExtension: '.json',
        directory: join(__dirname, '../abis'),
        searchRecursive: true,
    });
    await abiRepo.initialize();

    //console.log((abiRepo as any).signatures);

    expect(
        abiRepo.decodeLogEvent(
            {
                logIndex: '0x1',
                blockNumber: '0x1bf',
                blockHash: '0x16545b7f5052ebde2812b8ac8ad5d64da83e60bfe32c22f4e15a76f45b3acd47',
                transactionHash: '0xb0d235d01b32b0f39e547117b5ec4f553dba0976e0b41ef58da1832c86de73f6',
                transactionIndex: '0x0',
                address: '0xa0EB7CA45F646EA73F3d4F41eC197900A00CcdBf',
                data: '0x0000000000000000000000000000000000000000000000000429d069189e0000',
                topics: [
                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                    '0x00000000000000000000000067a97472c05e50d38f64b41967fbad326cddf2e0',
                    '0x00000000000000000000000046e88bd2d06b8d405730e7c4af96e91c0e7fa5de',
                ],
            },
            { contractFingerprint: '30f0d1068a77a3aaa446f680f4aa961c9e981bff9aba4a0962230867d0f3ddf9' }
        )
    ).toMatchInlineSnapshot(`
        Object {
          "args": Object {
            "from": "0x67a97472C05E50d38F64b41967fbaD326cdDF2E0",
            "to": "0x46E88bD2d06B8D405730E7C4af96e91c0E7FA5dE",
            "value": "300000000000000000",
          },
          "name": "Transfer",
          "params": Array [
            Object {
              "name": "from",
              "type": "address",
              "value": "0x67a97472C05E50d38F64b41967fbaD326cdDF2E0",
            },
            Object {
              "name": "to",
              "type": "address",
              "value": "0x46E88bD2d06B8D405730E7C4af96e91c0E7FA5dE",
            },
            Object {
              "name": "value",
              "type": "uint256",
              "value": "300000000000000000",
            },
          ],
          "signature": "Transfer(address,address,uint256)",
        }
    `);
});
