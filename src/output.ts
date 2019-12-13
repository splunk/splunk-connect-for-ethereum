import { SplunkHecConfig } from './config';
import { HecClient } from './hec';
import {
    BlockMessage,
    GethPeerMessage,
    LogEventMessage,
    NodeMetricsMessage,
    PendingTransactionMessage,
    QuorumProtocolMessage,
    TransactionMessage,
    NodeInfoMessage,
} from './msgs';
import { createDebug } from './utils/debug';
import { prefixKeys } from './utils/obj';
import { ManagedResource } from './utils/resource';

const consoleOutput = createDebug('output');
consoleOutput.enabled = true;

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
    constructor(private hec: HecClient, private config: SplunkHecConfig) {}

    public write(msg: OutputMessage) {
        switch (msg.type) {
            case 'block':
            case 'transaction':
            case 'event':
            case 'pendingtx':
            case 'nodeInfo':
            case 'quorumProtocol':
            case 'gethPeer':
                this.hec.pushEvent({
                    time: msg.time,
                    body: msg.body,
                    metadata: {
                        index: this.config.eventIndex,
                        sourcetype: this.config.sourcetypes[msg.type],
                    },
                });
                break;
            case 'nodeMetrics':
                const metricsPrefix = this.config.metricsPrefix ? this.config.metricsPrefix + '.' : '';
                this.hec.pushMetrics({
                    time: msg.time,
                    measurements: prefixKeys(msg.metrics, metricsPrefix, true),
                    metadata: {
                        index: this.config.metricsIndex,
                        sourcetype: this.config.sourcetypes.nodeMetrics,
                    },
                });
                break;
            default:
                throw new Error(`Unrecognized output message: ${msg}`);
        }
    }

    public shutdown() {
        return this.hec.shutdown();
    }
}

export class ConsoleOutput implements Output {
    write(msg: OutputMessage) {
        consoleOutput('%O', msg);
    }

    public async shutdown() {
        // noop
    }
}

export class FileOutput implements Output {
    write(msg: OutputMessage) {
        // TODO
        console.log(msg); // eslint-disable-line no-console
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
