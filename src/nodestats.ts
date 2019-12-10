import { NodePlatformAdapter } from './platforms';
import { ManagedResource } from './utils/resource';
import { sleep, alwaysResolve } from './utils/async';
import { Output } from './output';
import { AbortManager, ABORT } from './utils/abort';
import { createModuleDebug } from './utils/debug';
import { EthereumClient } from './eth/client';
import { WaitTime, resolveWaitTime, linearBackoff } from './utils/retry';

const { debug, info, error } = createModuleDebug('nodestats');

export class NodeStatsCollector implements ManagedResource {
    private abort = new AbortManager();
    private lastPromise: Promise<number> | null = null;
    private waitAfterFailure: WaitTime;
    constructor(
        private config: {
            platformAdapter: NodePlatformAdapter;
            ethClient: EthereumClient;
            output: Output;
            interval: number;
            waitAfterFailure?: WaitTime;
        }
    ) {
        this.waitAfterFailure = config.waitAfterFailure || linearBackoff({ min: 0, step: 2500, max: 120_000 });
    }

    public async start() {
        debug('Starting node stats collector');
        let failed = 0;
        while (!this.abort.aborted) {
            const startTime = Date.now();
            try {
                const p = this.collect();
                this.lastPromise = p;
                const results = await p;
                info('Collected %d nodestats messages in %d ms', results, Date.now() - startTime);
                failed = 0;
            } catch (e) {
                if (e === ABORT) {
                    return;
                }
                failed++;
                error('Failed to collecto node stats (%d consecutive failures):', failed, e);
                const waitAfterFailure = resolveWaitTime(this.waitAfterFailure, failed);
                debug('Waiting for %d ms after failure #%d', waitAfterFailure, failed);
                await this.abort.race(sleep(waitAfterFailure));
            } finally {
                this.lastPromise = null;
            }

            const waitForNext = Math.max(0, this.config.interval - (Date.now() - startTime));
            debug('Waiting for %d ms before collecting node stats again', waitForNext);
            await this.abort.race(sleep(waitForNext));
        }
        debug('Node stats collector completed');
    }

    private async collect(): Promise<number> {
        const { platformAdapter, ethClient, output } = this.config;
        const msgs = await this.abort.race(platformAdapter.captureNodeStats(ethClient, Date.now()));
        if (!this.abort.aborted) {
            msgs.forEach(msg => output.write(msg));
        }
        return msgs.length;
    }

    public async shutdown() {
        this.abort.abort();
        if (this.lastPromise != null) {
            await alwaysResolve(this.lastPromise);
            this.lastPromise = null;
        }
        info('Node stats collector shutdown complete');
    }
}
