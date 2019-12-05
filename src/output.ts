import { SplunkHecConfig } from './config';
import { HecClient } from './hec';
import { BlockMessage, LogEventMessage, PendingTransactionMessage, TransactionMessage } from './msgs';
import { createDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';

const consoleOutput = createDebug('output');
consoleOutput.enabled = true;

export type OutputMessage = BlockMessage | TransactionMessage | PendingTransactionMessage | LogEventMessage;

export interface Output extends ManagedResource {
    write(message: OutputMessage): void;
}

export class HecOutput implements Output, ManagedResource {
    constructor(private hec: HecClient, private config: SplunkHecConfig) {}

    public write(msg: OutputMessage) {
        switch (msg.type) {
            case 'block':
                this.hec.pushEvent({
                    time: msg.time,
                    body: msg.block,
                    metadata: {
                        index: this.config.eventIndex,
                        sourcetype: this.config.sourcetypes.block,
                    },
                });
                break;
            case 'transaction':
                this.hec.pushEvent({
                    time: msg.time,
                    body: msg.tx,
                    metadata: {
                        index: this.config.eventIndex,
                        sourcetype: this.config.sourcetypes.transaction,
                    },
                });
                break;
            case 'event':
                this.hec.pushEvent({
                    time: msg.time,
                    body: msg.event,
                    metadata: {
                        index: this.config.eventIndex,
                        sourcetype: this.config.sourcetypes.event,
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
        console.log(msg); // eslint-disable-line no-console
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
