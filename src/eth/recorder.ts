/* eslint-disable @typescript-eslint/no-unused-vars */
import { EthereumTransport } from './transport';
import { JsonRpcRequest, JsonRpcResponse } from './jsonrpc';
import { createModuleDebug } from '../utils/debug';
import { mkdirp, writeFile, readFile } from 'fs-extra';
import { join } from 'path';

const { info } = createModuleDebug('eth:recorder');

interface Record {
    req: Omit<Omit<JsonRpcRequest, 'id'>, 'jsonrpc'>;
    res: Omit<Omit<JsonRpcResponse, 'id'>, 'jsonrpc'> | null;
}

export class RecorderEthTransport implements EthereumTransport {
    private records: Record[] = [];
    constructor(private delegate: EthereumTransport) {}

    get source(): string {
        return this.delegate.source;
    }

    private record(request: JsonRpcRequest, response: JsonRpcResponse) {
        info('Recording eth request %s', request.method);
        const { id: _1, jsonrpc: _j1, ...req } = request;
        const { id: _2, jsonrpc: _j2, ...res } = response;
        this.records.push({ req, res });
    }

    public async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
        const res = await this.delegate.send(request);
        this.record(request, res);
        return res;
    }

    public async sendBatch(requests: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
        const responses = await this.delegate.sendBatch(requests);

        for (const req of requests) {
            const res = responses.find(r => r.id === req.id);
            if (res != null) {
                this.record(req, res);
            }
        }

        return responses;
    }

    public async save(name: string, dir: string) {
        await mkdirp(dir);
        await writeFile(join(dir, `${name}.rec`), `[\n${this.records.map(r => JSON.stringify(r)).join(',\n')}\n]`, {
            encoding: 'utf-8',
        });
    }
}

export class ReplayEthTransport implements EthereumTransport {
    constructor(private records: Record[], public source: string) {}

    public async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
        const paramsEqual = (a: any[] = [], b: any[] = []) => a.length === b.length && a.every((e, i) => b[i] === e);
        const reqMatches = (r: Record) => r.req.method === request.method && paramsEqual(r.req.params, request.params);
        const recordIdx = this.records.findIndex(reqMatches);
        if (recordIdx < 0) {
            throw new Error(
                `Failed to replay request ${request.method}(${request.params.join(
                    ', '
                )}) - no matching recorded request found`
            );
        }
        const rec = this.records[recordIdx];

        const hasMoreMatchingRecords = this.records.some((r, i) => i > recordIdx && reqMatches(r));
        if (hasMoreMatchingRecords) {
            this.records.splice(recordIdx, 1);
        }

        return {
            jsonrpc: '2.0',
            id: request.id,
            ...rec.res,
        };
    }

    public async sendBatch(requests: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
        return Promise.all(requests.map(req => this.send(req)));
    }
}

export async function withRecorder(
    delegate: EthereumTransport,
    options: {
        replay?: boolean;
        name: string;
        storageDir: string;
    },
    task: (transport: EthereumTransport) => Promise<void>
) {
    if (options.replay) {
        // todo
        const recordPath = join(options.storageDir, `${options.name}.rec`);
        const data = await readFile(recordPath, { encoding: 'utf-8' });
        const records = JSON.parse(data);
        const transport = new ReplayEthTransport(records, delegate.source);
        await task(transport);
    } else {
        const recorder = new RecorderEthTransport(delegate);
        await task(recorder);
        await recorder.save(options.name, options.storageDir);
    }
}
