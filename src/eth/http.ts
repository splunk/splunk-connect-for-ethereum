import { default as HttpAgent, HttpOptions, HttpsAgent } from 'agentkeepalive';
import fetch from 'node-fetch';
import { createModuleDebug } from '../utils/debug';
import { isHttps } from '../utils/http';
import { isValidJsonRpcResponse, JsonRpcRequest, JsonRpcResponse } from './jsonrpc';
import { EthereumTransport } from './transport';
import { httpClientStats } from '../utils/stats';

const { debug, trace } = createModuleDebug('eth:http');

export interface HttpTransportConfig {
    url: string;
    timeout?: number;
    validateCertificate?: boolean;
    requestKeepAlive?: boolean;
    maxSockets?: number;
}

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

    constructor(config: HttpTransportConfig) {
        this.config = { ...CONFIG_DEFAULTS, ...config };
        const baseAgentOptions: HttpOptions = {
            keepAlive: true,
            maxSockets: 256,
        };
        this.httpAgent = isHttps(this.config.url)
            ? new HttpsAgent({
                  ...baseAgentOptions,
                  rejectUnauthorized: this.config.validateCertificate,
              })
            : new HttpAgent(baseAgentOptions);
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
        const body = JSON.stringify(request);
        trace(`Sending JSON RPC request over HTTP\n%s`, body);
        const response = await fetch(this.config.url, {
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
                `JSON RPC service ${this.config.url} responded with HTTP status ${response.status} (${response.statusText})`
            );
        }

        const data = await response.json();

        trace('Received JSON RPC response:\n%O', data);
        if (!isValidJsonRpcResponse(data)) {
            throw new Error('Invalid JSON RPC response');
        }

        debug('Completed JSON RPC request in %d ms', Date.now() - startTime);
        return data as JsonRpcResponse | JsonRpcResponse[];
    }

    public get stats() {
        return {
            ...this.counters,
            httpClient: httpClientStats(this.httpAgent.getCurrentStatus()),
        };
    }

    public flushStats() {
        const stats = this.stats;
        this.counters = { ...initialCounters };
        return stats;
    }
}
