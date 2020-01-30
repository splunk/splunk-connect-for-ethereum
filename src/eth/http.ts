import { default as HttpAgent, HttpOptions, HttpsAgent } from 'agentkeepalive';
import fetch from 'node-fetch';
import { createModuleDebug } from '../utils/debug';
import { isHttps } from '../utils/httputils';
import { isValidJsonRpcResponse, JsonRpcRequest, JsonRpcResponse, checkError } from './jsonrpc';
import { EthereumTransport } from './transport';
import { httpClientStats, AggregateMetric } from '../utils/stats';
import { HttpTransportConfig } from '../config';

const { debug, trace } = createModuleDebug('eth:http');

const CONFIG_DEFAULTS = {
    timeout: 60_000,
    validateCertificate: true,
    requestKeepAlive: true,
    maxSockets: 256,
};

const initialCounters = {
    requests: 0,
    errors: 0,
};

export class HttpTransport implements EthereumTransport {
    private config: HttpTransportConfig & typeof CONFIG_DEFAULTS;
    private httpAgent: HttpAgent | HttpsAgent;
    private counters = { ...initialCounters };
    private aggregates = { requestDuration: new AggregateMetric(), batchSize: new AggregateMetric() };

    constructor(private url: string, config: HttpTransportConfig) {
        this.config = { ...CONFIG_DEFAULTS, ...config };
        const baseAgentOptions: HttpOptions = {
            keepAlive: true,
            maxSockets: 256,
        };
        this.httpAgent = isHttps(url)
            ? new HttpsAgent({
                  ...baseAgentOptions,
                  rejectUnauthorized: this.config.validateCertificate,
              })
            : new HttpAgent(baseAgentOptions);
    }

    public get source() {
        const u = new URL(this.url);
        return `jsonprc+${u.origin}`;
    }

    public get originHost() {
        return new URL(this.url).hostname;
    }

    public async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
        debug('Sending JSON RPC request: %o', request.method);
        const result = await this.sendInternal(request);
        if (Array.isArray(result)) {
            throw new Error(`JSON RPC returned batch but expected single message`);
        }
        return result;
    }

    public async sendBatch(request: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
        debug('Sending JSON RPC batch containing %d requests', request.length);
        const result = await this.sendInternal(request);
        if (!Array.isArray(result)) {
            throw new Error(`JSON RPC returned single message, was expecting batch`);
        }
        return result;
    }

    public async sendInternal(
        request: JsonRpcRequest | JsonRpcRequest[]
    ): Promise<JsonRpcResponse | JsonRpcResponse[]> {
        const startTime = Date.now();
        trace(`Sending JSON RPC request over HTTP: %O`, request);
        const body = JSON.stringify(request);
        this.counters.requests++;
        this.aggregates.batchSize.push(Array.isArray(request) ? request.length : 1);
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': String(body.length),
                },
                body,
                agent: this.httpAgent,
                timeout: this.config.timeout,
            });
            if (response.status < 200 || response.status > 299) {
                throw new Error(
                    `JSON RPC service ${this.url} responded with HTTP status ${response.status} (${response.statusText})`
                );
            }
            const data = await response.json();
            trace('Received JSON RPC response:\n%O', data);
            if (!isValidJsonRpcResponse(data)) {
                throw new Error('Invalid JSON RPC response');
            }
            this.aggregates.requestDuration.push(Date.now() - startTime);
            debug('Completed JSON RPC request in %d ms', Date.now() - startTime);

            if (Array.isArray(request) !== Array.isArray(data)) {
                checkError(Array.isArray(data) ? data[0] : data);
                throw new Error(
                    Array.isArray(request)
                        ? 'JSON RPC returned single message, was expecting batch'
                        : 'JSON RPC returned batch, was expecting single message'
                );
            }

            return data as JsonRpcResponse | JsonRpcResponse[];
        } catch (e) {
            this.counters.errors++;
            this.aggregates.requestDuration.push(Date.now() - startTime);
            throw e;
        }
    }

    public get stats() {
        return {
            ...this.counters,
            httpClient: httpClientStats(this.httpAgent.getCurrentStatus()),
        };
    }

    public flushStats() {
        const stats = {
            ...this.counters,
            ...this.aggregates.requestDuration.flush('requestDuration'),
            ...this.aggregates.batchSize.flush('batchSize'),
        };
        this.counters = { ...initialCounters };
        return stats;
    }
}
