import { join } from 'path';
import { ContractInfo } from '../../src/abi/contract';
import { AbiRepository } from '../../src/abi/repo';
import { BlockWatcher } from '../../src/blockwatcher';
import { Checkpoint } from '../../src/checkpoint';
import { BatchedEthereumClient } from '../../src/eth/client';
import { HttpTransport } from '../../src/eth/http';
import { withRecorder } from '../../src/eth/recorder';
import { MOCK_NODE_ADAPTER } from '../../src/platforms/mock';
import { suppressDebugLogging } from '../../src/utils/debug';
import { LRUCache } from '../../src/utils/lru';
import { TestOutput } from '../testoutput';

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

const BLOCK = 10237208;
test(`mainnet overflow ${BLOCK}`, async () => {
    await withRecorder(
        new HttpTransport(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`, {}),
        {
            name: `testcases-mainnet-overflow-${BLOCK}`,
            storageDir: join(__dirname, '../fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const abiRepo = new AbiRepository({
                decodeAnonymous: true,
                fingerprintContracts: true,
                abiFileExtension: '.json',
                searchRecursive: true,
                requireContractMatch: true,
                reconcileStructShapeFromTuples: false,
            });
            await abiRepo.initialize();
            const checkpoints = new Checkpoint({
                initialBlockNumber: 0,
                path: join(__dirname, `../../tmp/tmpcheckpoint_${BLOCK}.json`),
                saveInterval: 10000,
            });
            const output = new TestOutput();
            const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 100 });
            const blockWatcher = new BlockWatcher({
                abiRepo,
                checkpoints,
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
                chunkQueueMaxSize: 10,
                contractInfoCache,
                waitAfterFailure: 1,
                nodePlatform: MOCK_NODE_ADAPTER,
            });

            await expect(blockWatcher.processChunk({ from: BLOCK, to: BLOCK })).resolves.toBeUndefined();
        }
    );
}, 15000);
