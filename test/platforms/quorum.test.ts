import { HttpTransport } from '../../src/eth/http';
import { BatchedEthereumClient } from '../../src/eth/client';
import { introspectTargetNodePlatform } from '../../src/introspect';
import { withRecorder } from '../../src/eth/recorder';
import { join } from 'path';
import { suppressDebugLogging } from '../../src/utils/debug';
import { BlockWatcher } from '../../src/blockwatcher';
import { AbiRepository } from '../../src/abi/repo';
import { State } from '../../src/state';
import { TestOutput } from '../testoutput';

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

test('decrypt private transaction', async () => {
    await withRecorder(
        new HttpTransport('http://localhost:22000', {}),
        {
            name: 'local-quorum',
            storageDir: join(__dirname, '../fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client);

            expect(platformAdapter.name).toMatchInlineSnapshot(`"quorum:raft"`);
            const output = new TestOutput();
            const abiRepo = new AbiRepository({
                decodeAnonymous: false,
                fingerprintContracts: false,
                requireContractMatch: false,
                reconcileStructShapeFromTuples: false,
            });

            abiRepo.addAbi({
                contractName: 'simplestorage',
                entries: [
                    {
                        sig: 'set(uint256)',
                        abi: {
                            name: 'set',
                            type: 'function',
                            inputs: [
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                        },
                    },
                ],
            });
            const state = new State({
                path: join(__dirname, '../../tmp'),
                saveInterval: 1,
            });
            const checkpoint = state.getCheckpoint('main');
            checkpoint.setInitialBlockNumber(0);
            const blockWatcher = new BlockWatcher({
                ethClient: client,
                abiRepo,
                checkpoint: checkpoint,
                config: {
                    enabled: true,
                    decryptPrivateTransactions: true,
                    blocksMaxChunkSize: 100,
                    maxParallelChunks: 20,
                    pollInterval: 1000,
                    retryWaitTime: 10,
                    startAt: 'genesis',
                },
                nodePlatform: platformAdapter,
                output,
            });

            await blockWatcher.processChunk({ from: 3, to: 3 });

            expect(output.messages.filter(m => m.type === 'transaction')).toMatchInlineSnapshot(`
                Array [
                  Object {
                    "body": Object {
                      "blockHash": "0x30350ce38a811cafbacfe02a364bcce426828812c06c9da3d7a7c44946027b0a",
                      "blockNumber": 3,
                      "call": Object {
                        "args": Object {
                          "value": 4711,
                        },
                        "name": "set",
                        "params": Array [
                          Object {
                            "name": "value",
                            "type": "uint256",
                            "value": 4711,
                          },
                        ],
                        "signature": "set(uint256)",
                      },
                      "contractAddress": null,
                      "contractAddressInfo": undefined,
                      "cumulativeGasUsed": 0,
                      "from": "0xed9d02e382b34818e88B88a309c7fe71E65f419d",
                      "fromInfo": Object {
                        "contractName": undefined,
                        "isContract": false,
                      },
                      "gas": 30220,
                      "gasPrice": 0,
                      "gasUsed": 0,
                      "hash": "0x3ccec589aedcfc470bb94435599df9352a13dfd923e95defeaf2dd3dd72b8d21",
                      "input": "0x5724f0e198007033e2142b5c89303b1fbd93ee45823a30996519b405b1a9035a685b2e81fb34ca0c4cdb9a602e46873d3bdf5582054541f4acf7e9af34a55970",
                      "nonce": 2,
                      "privatePayload": Object {
                        "input": "0x60fe47b10000000000000000000000000000000000000000000000000000000000001267",
                      },
                      "r": "0xcb17d46bddf85d6ea1d533d5a3fad35ce9a4610ad91d17461201fa16371f69ad",
                      "s": "0x556988ac9a29b3bc6aa1d57e5cd7cb39d18d23062cddbdf30cb31d95ed83f4dd",
                      "status": "success",
                      "to": "0x1349F3e1B8D71eFfb47B840594Ff27dA7E603d17",
                      "toInfo": Object {
                        "contractName": undefined,
                        "isContract": true,
                      },
                      "transactionIndex": 0,
                      "v": "0x25",
                      "value": 0,
                    },
                    "time": 1597452336680,
                    "type": "transaction",
                  },
                ]
            `);
        }
    );
}, 15000);
