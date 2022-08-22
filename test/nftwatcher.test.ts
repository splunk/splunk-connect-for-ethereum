import { join } from 'path';
import { ContractInfo } from '../src/abi/contract';
import { State } from '../src/state';
import { BatchedEthereumClient } from '../src/eth/client';
import { HttpTransport } from '../src/eth/http';
import { withRecorder } from '../src/eth/recorder';
import { createModuleDebug, suppressDebugLogging } from '../src/utils/debug';
import LRUCache from '../src/utils/lru';
import { TestOutput } from './testoutput';
import { MOCK_NODE_ADAPTER } from '../src/platforms/mock';
import { NFTWatcher } from '../lib/nftwatcher';
import { mkdirp, readFile, writeFile } from 'fs-extra';
import { DefaultFetchTransport, FetchTransport } from '../src/nftwatcher';
import { RequestInfo, RequestInit, Response } from 'node-fetch';

const { info } = createModuleDebug('nftwatcher');

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

interface Record {
    request: RequestInfo;
    init: RequestInit | undefined;
    response: string;
}

class RecorderFetchTransport implements FetchTransport {
    private records: Record[] = [];
    constructor(private delegate: FetchTransport) {}

    private async record(request: RequestInfo, response: Response, init?: RequestInit | undefined) {
        info('Recording fetch request %s', request);
        const bodyRaw = await response.json();
        const body = JSON.stringify(bodyRaw);
        this.records.push({ request, init, response: body });
    }

    public async fetch(url: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
        const res = await this.delegate.fetch(url, init);
        await this.record(url, res, init);
        return res;
    }

    public async save(name: string, dir: string) {
        await mkdirp(dir);
        await writeFile(join(dir, `${name}.rec`), `[\n${this.records.map(r => JSON.stringify(r)).join(',\n')}\n]`, {
            encoding: 'utf-8',
        });
    }
}

export class ReplayFetchTransport implements FetchTransport {
    constructor(private records: Record[]) {}

    public async fetch(url: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
        const requestJson = JSON.stringify({ url: url });
        const reqMatches = (r: Record) => JSON.stringify({ url: r.request }) === requestJson;
        const recordIdx = this.records.findIndex(reqMatches);
        if (recordIdx < 0) {
            throw new Error(`Failed to replay request ${requestJson}) - no matching recorded request found`);
        }
        const rec = this.records[recordIdx];

        const hasMoreMatchingRecords = this.records.some((r, i) => i > recordIdx && reqMatches(r));
        if (hasMoreMatchingRecords) {
            this.records.splice(recordIdx, 1);
        }

        return new Response(rec.response);
    }
}

test('nftwatcher', async () => {
    const replay = true;
    const storageDir = join(__dirname, './fixtures/recorded');
    const name = 'xdai-nftwatcher';
    const recordPath = join(storageDir, `${name}-fetch.rec`);
    let fetchTransport: FetchTransport;
    if (replay) {
        const data = await readFile(recordPath, { encoding: 'utf-8' });
        const records = JSON.parse(data);
        fetchTransport = new ReplayFetchTransport(records);
    } else {
        fetchTransport = new RecorderFetchTransport(new DefaultFetchTransport());
    }

    await withRecorder(
        new HttpTransport('https://rpc.gnosischain.com', {}),
        {
            name: name,
            storageDir: storageDir,
            replay: replay,
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
                fetchTransport: fetchTransport,
            });

            await nftWatcher.processChunk({ from: 22132890, to: 22132907 });

            expect(output.messages).toMatchSnapshot();
        }
    );
    if (!replay) {
        await (fetchTransport as RecorderFetchTransport).save(`${name}-fetch`, storageDir);
    }
}, 15000);
