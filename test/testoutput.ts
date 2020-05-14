import { Stats } from '@splunkdlt/stats-collector';
import { Output, OutputMessage } from '../src/output';

export class TestOutput implements Output {
    public messages: OutputMessage[] = [];

    write(msg: OutputMessage) {
        this.messages.push(msg);
    }

    async shutdown() {
        throw new Error('shutdown');
    }

    flushStats(): Stats {
        throw new Error('no stats');
    }
}
