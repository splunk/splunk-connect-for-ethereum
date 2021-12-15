import { join } from 'path';
import { ContractInfo } from '../src/abi/contract';
import { State } from '../src/state';
import { BatchedEthereumClient } from '../src/eth/client';
import { HttpTransport } from '../src/eth/http';
import { withRecorder } from '../src/eth/recorder';
import { suppressDebugLogging } from '../src/utils/debug';
import LRUCache from '../src/utils/lru';
import { TestOutput } from './testoutput';
import { MOCK_NODE_ADAPTER } from '../src/platforms/mock';
import { NFTWatcher } from '../lib/nftwatcher';

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

test('nftwatcher', async () => {
    await withRecorder(
        new HttpTransport('https://dai.poa.network', {}),
        {
            name: 'xdai-nftwatcher',
            storageDir: join(__dirname, './fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const state = new State({
                path: join(__dirname, '../tmp/tmpcheckpoint.json'),
                saveInterval: 10000,
            });
            const checkpoint = state.getCheckpoint('main');
            checkpoint.setInitialBlockNumber(123);
            const output = new TestOutput();
            const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 100 });
            const nftWatcher = new NFTWatcher({
                checkpoint,
                config: {
                    contractAddress: '0x22c1f6050e56d2876009903609a2cc3fef83b415',
                    enabled: true,
                    blocksMaxChunkSize: 1,
                    pollInterval: 1,
                    maxParallelChunks: 1,
                    startAt: 'latest',
                    retryWaitTime: 10,
                    logEthBalance: true,
                },
                ethClient,
                output,
                contractInfoCache,
                waitAfterFailure: 1,
                nodePlatform: MOCK_NODE_ADAPTER,
                collectRetrievalTime: false,
            });

            await nftWatcher.processChunk({ from: 19595071, to: 19595091 });

            expect(output.messages).toMatchSnapshot();
        }
    );
}, 15000);
