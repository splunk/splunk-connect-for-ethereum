import debugModule from 'debug';
import { join } from 'path';
import { ContractInfo } from '../../../src/abi/contract';
import { AbiRepository } from '../../../src/abi/repo';
import { BlockWatcher } from '../../../src/blockwatcher';
import { State } from '../../../src/state';
import { BatchedEthereumClient } from '../../../src/eth/client';
import { HttpTransport } from '../../../src/eth/http';
import { withRecorder } from '../../../src/eth/recorder';
import { MOCK_NODE_ADAPTER } from '../../../src/platforms/mock';
import { enableTraceLogging, suppressDebugLogging } from '../../../src/utils/debug';
import { LRUCache } from '../../../src/utils/lru';
import { TestOutput } from '../../testoutput';

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

test('blockwatcher', async () => {
    const BLOCK = 9450348;
    enableTraceLogging();
    debugModule.enable('ethlogger:abi:*');
    await withRecorder(
        new HttpTransport('http://178.128.78.72:41414', {}),
        {
            name: `testcases-ost-${BLOCK}`,
            storageDir: join(__dirname, '../../fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const abiRepo = new AbiRepository({
                decodeAnonymous: true,
                fingerprintContracts: true,
                abiFileExtension: '.json',
                directory: join(__dirname, 'abis'),
                searchRecursive: true,
                requireContractMatch: true,
                reconcileStructShapeFromTuples: false,
            });
            await abiRepo.initialize();
            const checkpoints = new State({
                path: join(__dirname, '../../../tmp/tmpcheckpoint.json'),
                saveInterval: 10000,
            });
            const checkpoint = checkpoints.getCheckpoint('main');
            checkpoint.setInitialBlockNumber(0);
            const output = new TestOutput();
            const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 100 });
            const blockWatcher = new BlockWatcher({
                abiRepo,
                checkpoint,
                config: {
                    enabled: true,
                    blocksMaxChunkSize: 1,
                    pollInterval: 1,
                    maxParallelChunks: 1,
                    startAt: 'latest',
                    decryptPrivateTransactions: false,
                    retryWaitTime: 10,
                },
                ethClient,
                output,
                contractInfoCache,
                waitAfterFailure: 1,
                nodePlatform: MOCK_NODE_ADAPTER,
            });

            // const contractInfo = await blockWatcher.lookupContractInfo('0x3FE42c2842377a5F4dc0E521720fb0f0048Baf9A');

            // // expect(contractInfo).toMatchInlineSnapshot(`
            // //     Object {
            // //       "contractName": undefined,
            // //       "fingerprint": "192d4d6c01b541232da06f70e1abcfb5ee3c94a8e3a49b677ea777d840f54469",
            // //       "isContract": true,
            // //     }
            // // `);

            await expect(blockWatcher.lookupContractInfo('0x91a3fc081eeBa0941E0cEf2F657c76667a6dCbc7')).resolves
                .toMatchInlineSnapshot(`
                        Object {
                          "contractName": "Proxy",
                          "fingerprint": "5fbb1465fc2625f82a9dced228d1baf964623e9b44ad8591842bdd42b4953b1f",
                          "isContract": true,
                        }
                    `);
        }
    );
}, 15000);
