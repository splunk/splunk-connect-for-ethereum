import { EthereumClient } from './eth/client';
import { Output } from './output';
import { NodePlatformAdapter } from './platforms';
import { ABORT, AbortManager } from './utils/abort';
import { alwaysResolve, sleep } from './utils/async';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';
import { linearBackoff, resolveWaitTime, WaitTime } from './utils/retry';
import { AggregateMetric } from './utils/stats';
import { AbiRepository } from './abi';
import { ContractInfo } from './contract';
import { Cache } from './utils/cache';

const { debug, info, error } = createModuleDebug('nodestats');

const initialCounters = {
    infoCollectCount: 0,
    infoErrorCount: 0,
    collectCount: 0,
    errorCount: 0,
};

export class NodeStatsCollector implements ManagedResource {
    private abort = new AbortManager();
    private donePromise: Promise<any> | null = null;
    private waitAfterFailure: WaitTime;
    private counters = { ...initialCounters };
    private aggregates = {
        infoCollectDuration: new AggregateMetric(),
        collectDuration: new AggregateMetric(),
    };
    constructor(
        private config: {
            platformAdapter: NodePlatformAdapter;
            ethClient: EthereumClient;
            output: Output;
            abiRepo?: AbiRepository;
            contractInfoCache?: Cache<string, Promise<ContractInfo>>;
            statsInterval: number;
            infoInterval: number;
            waitAfterFailure?: WaitTime;
        }
    ) {
        this.waitAfterFailure = config.waitAfterFailure ?? linearBackoff({ min: 0, step: 2500, max: 120_000 });
    }

    public async start() {
        debug('Starting node stats collector');
        const p = Promise.all([this.startCollectingNodeInfo(), this.startCollectingNodeStats()]);
        this.donePromise = p;
        await p;
        debug('Node stats collector completed');
    }

    private async startCollectingNodeInfo() {
        debug('Starting node info collection every %d ms', this.config.infoInterval);
        const { platformAdapter, ethClient, output } = this.config;
        let failed = 0;
        while (!this.abort.aborted) {
            const startTime = Date.now();
            try {
                this.counters.infoCollectCount++;

                const nodeInfo = await this.abort.race(platformAdapter.captureNodeInfo(ethClient));
                output.write({
                    type: 'nodeInfo',
                    time: Date.now(),
                    body: nodeInfo,
                });

                this.aggregates.infoCollectDuration.push(Date.now() - startTime);
                info('Collected node info in %d ms', Date.now() - startTime);
                failed = 0;
            } catch (e) {
                if (e === ABORT) {
                    break;
                }
                this.counters.infoErrorCount++;
                failed++;
                error('Failed to collect node info (%d consecutive failures):', failed, e);
                const waitAfterFailure = resolveWaitTime(this.waitAfterFailure, failed);
                debug('Waiting for %d ms after failure #%d', waitAfterFailure, failed);
                await this.abort.race(sleep(waitAfterFailure));
            } finally {
                this.donePromise = null;
            }

            const waitForNext = Math.max(0, this.config.infoInterval - (Date.now() - startTime));
            debug('Waiting for %d ms before collecting node info again', waitForNext);
            await this.abort.race(sleep(waitForNext));
        }
    }

    private async startCollectingNodeStats() {
        debug('Starting node stats collection every %d ms', this.config.statsInterval);
        let failed = 0;
        while (!this.abort.aborted) {
            const startTime = Date.now();
            try {
                this.counters.collectCount++;
                const results = await this.collectNodeStats();
                this.aggregates.collectDuration.push(Date.now() - startTime);
                info('Collected %d nodestats messages in %d ms', results, Date.now() - startTime);
                failed = 0;
            } catch (e) {
                if (e === ABORT) {
                    break;
                }
                this.counters.errorCount++;
                failed++;
                error('Failed to collect node stats (%d consecutive failures):', failed, e);
                const waitAfterFailure = resolveWaitTime(this.waitAfterFailure, failed);
                debug('Waiting for %d ms after failure #%d', waitAfterFailure, failed);
                await this.abort.race(sleep(waitAfterFailure));
            } finally {
                this.donePromise = null;
            }

            const waitForNext = Math.max(0, this.config.statsInterval - (Date.now() - startTime));
            debug('Waiting for %d ms before collecting node stats again', waitForNext);
            await this.abort.race(sleep(waitForNext));
        }
    }

    private async collectNodeStats(): Promise<number> {
        const { platformAdapter, ethClient, output } = this.config;
        const msgs = await this.abort.race(platformAdapter.captureNodeStats(ethClient, Date.now()));
        if (!this.abort.aborted) {
            msgs.forEach(msg => output.write(msg));
        }
        return msgs.length;
    }

    public flushStats() {
        const stats = { ...this.counters, ...this.aggregates.collectDuration.flush('collectDuration') };
        this.counters = { ...initialCounters };
        return stats;
    }

    public async shutdown() {
        this.abort.abort();
        if (this.donePromise != null) {
            await alwaysResolve(this.donePromise);
            this.donePromise = null;
        }
        info('Node stats collector shutdown complete');
    }
}
