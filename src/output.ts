import { EthloggerConfig, HecOutputConfig } from './config';
import { HecClient } from './hec';
import {
    BlockMessage,
    GethPeerMessage,
    LogEventMessage,
    NodeInfoMessage,
    NodeMetricsMessage,
    PendingTransactionMessage,
    QuorumProtocolMessage,
    TransactionMessage,
} from './msgs';
import { createDebug } from './utils/debug';
import { prefixKeys } from './utils/obj';
import { ManagedResource } from './utils/resource';

export const defaultSourcetypes = {
    block: 'ethereum:block',
    transaction: 'ethereum:transaction',
    event: 'ethereum:transaction:event',
    pendingtx: 'ethereum:transaction:pending',
    nodeInfo: 'ethereum:node:info',
    nodeMetrics: 'ethereum:node:metrics',
    quorumProtocol: 'ethereum:quorum:protocol',
    gethPeer: 'ethereum:geth:peer',
};

export type OutputMessage =
    | BlockMessage
    | TransactionMessage
    | PendingTransactionMessage
    | LogEventMessage
    | NodeInfoMessage
    | NodeMetricsMessage
    | QuorumProtocolMessage
    | GethPeerMessage;

export interface Output extends ManagedResource {
    write(message: OutputMessage): void;
}

export class HecOutput implements Output, ManagedResource {
    constructor(private eventsHec: HecClient, private metricsHec: HecClient, private config: HecOutputConfig) {}

    public write(msg: OutputMessage) {
        switch (msg.type) {
            case 'block':
            case 'transaction':
            case 'event':
            case 'pendingtx':
            case 'nodeInfo':
            case 'quorumProtocol':
            case 'gethPeer':
                this.eventsHec.pushEvent({
                    time: msg.time,
                    body: msg.body,
                    metadata: {
                        sourcetype: this.config.sourcetypes[msg.type] ?? defaultSourcetypes[msg.type],
                    },
                });
                break;
            case 'nodeMetrics':
                const metricsPrefix = this.config.metricsPrefix ? this.config.metricsPrefix + '.' : '';
                this.metricsHec.pushMetrics({
                    time: msg.time,
                    measurements: prefixKeys(msg.metrics, metricsPrefix, true),
                    metadata: {
                        sourcetype: this.config.sourcetypes.nodeMetrics ?? defaultSourcetypes.nodeMetrics,
                    },
                });
                break;
            default:
                throw new Error(`Unrecognized output message: ${msg}`);
        }
    }

    public shutdown() {
        return Promise.all([this.eventsHec.shutdown(), this.metricsHec.shutdown()]).then(() => {
            /* noop */
        });
    }
}

export class FileOutput implements Output {
    write() {
        // TODO
    }

    public async shutdown() {
        // noop
    }
}

export class ConsoleOutput implements Output {
    private readonly consoleOutput = createDebug('output');

    constructor() {
        this.consoleOutput.enabled = true;
    }

    write(msg: OutputMessage) {
        this.consoleOutput('%O', msg);
    }

    public async shutdown() {
        // noop
    }
}

export class DevNullOutput implements Output {
    write() {
        // noop
    }

    public async shutdown() {
        // noop
    }
}

export function createOutput(config: EthloggerConfig, baseHecClient: HecClient): Output {
    if (config.output.type === 'hec') {
        const eventsHec = config.hec.events ? baseHecClient.clone(config.hec.events) : baseHecClient;
        const metricsHec = config.hec.metrics ? baseHecClient.clone(config.hec.metrics) : baseHecClient;
        return new HecOutput(eventsHec, metricsHec, config.output);
    } else if (config.output.type === 'console') {
        return new ConsoleOutput();
    } else if (config.output.type === 'file') {
        return new FileOutput();
    } else if (config.output.type === 'null') {
        return new DevNullOutput();
    }
    throw new Error(`Invalid output type: ${((config.output as any) ?? {}).type}`);
}
