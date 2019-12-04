import { HecClient } from './hec';
import { SplunkHecConfig } from './config';
import { ManagedResource } from './utils/resource';
import { createDebug } from './utils/debug';
import { BlockMessage, TransactionMessage, PendingTransactionMessage } from './msgs';

const consoleOutput = createDebug('output');
consoleOutput.enabled = true;

export type OutputMessage = BlockMessage | TransactionMessage | PendingTransactionMessage;

export interface Output extends ManagedResource {
    write(message: OutputMessage): void;
}

export class HecOutput implements Output {
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
