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
import { BalanceWatcher } from '../lib/balancewatcher';

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

test('balancewatcher', async () => {
    await withRecorder(
        new HttpTransport('https://dai.poa.network', {}),
        {
            name: 'xdai-balancewatcher',
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
            const nftWatcher = new BalanceWatcher({
                checkpoint,
                config: {
                    contractAddress: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
                    decimals: 18,
                    enabled: true,
                    blocksMaxChunkSize: 1,
                    pollInterval: 1,
                    maxParallelChunks: 1,
                    startAt: 'latest',
                    retryWaitTime: 10,
                },
                ethClient,
                output,
                contractInfoCache,
                waitAfterFailure: 1,
                nodePlatform: MOCK_NODE_ADAPTER,
            });

            await nftWatcher.processChunk({ from: 19227319, to: 19227329 });

            expect(output.messages).toMatchSnapshot();
        }
    );
}, 15000);
