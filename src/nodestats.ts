import { NodeInfoConfig, NodeMetricsConfig, PendingTxConfig } from './config';
import { EthereumClient } from './eth/client';
import { Output, OutputMessage } from './output';
import { NodePlatformAdapter } from './platforms';
import { ABORT, AbortHandle } from './utils/abort';
import { alwaysResolve, sleep } from './utils/async';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';
import { resolveWaitTime, WaitTime } from './utils/retry';
import { AggregateMetric } from './utils/stats';

const { debug, info, warn, error } = createModuleDebug('nodestats');

const initialCounters = {
    infoCollectCount: 0,
    infoErrorCount: 0,
    metricsCollectCount: 0,
    metricsErrorCount: 0,
    pendingTxCollectCount: 0,
    pendingTxErrorCount: 0,
};

export class NodeStatsCollector implements ManagedResource {
    private abort = new AbortHandle();
    private donePromise: Promise<any> | null = null;
    private counters = { ...initialCounters };
    private aggregates = {
        infoCollectDuration: new AggregateMetric(),
        metricsCollectDuration: new AggregateMetric(),
        pendingtxCollectDuration: new AggregateMetric(),
    };
    constructor(
        private config: {
            platformAdapter: NodePlatformAdapter;
            ethClient: EthereumClient;
            output: Output;
            nodeInfo: NodeInfoConfig;
            nodeMetrics: NodeMetricsConfig;
            pendingTx: PendingTxConfig;
        }
    ) {}

    public async start() {
        debug('Starting node stats collector');
        try {
            const p = Promise.all([
                this.startCollectingNodeInfo(),
                this.startCollectingNodeMetrics(),
                this.startCollectingPendingTransactions(),
            ]);
            this.donePromise = p;
            await p;
        } catch (e) {
            if (e !== ABORT) {
                error('Node stats collector stopped with error', e);
            }
        }
        debug('Node stats collector completed');
    }

    private async periodicallyCollect(
        task: (abortHandle: AbortHandle, startTime: number) => Promise<OutputMessage[]>,
        taskName: string,
        interval: number,
        retryWaitTime: WaitTime,
        aggregateMetric?: AggregateMetric,
        counter?: keyof typeof initialCounters,
        errorCounter?: keyof typeof initialCounters
    ) {
        debug('Starting collection of %s every %d ms', taskName, interval);

        const abort = this.abort;
        let failed = 0;
        while (!abort.aborted) {
            const startTime = Date.now();
            try {
                if (counter != null) {
                    this.counters[counter]++;
                }
                const msgs = await task(abort, startTime);

                if (!abort.aborted) {
                    for (const msg of msgs) {
                        this.config.output.write(msg);
                    }
                }

                info('Collected %s in %d ms', taskName, Date.now() - startTime);
                aggregateMetric?.push(Date.now() - startTime);
                failed = 0;
            } catch (e) {
                if (e === ABORT) {
                    info('Collection of %s aborted', taskName);
                    break;
                }
                failed++;
                if (errorCounter != null) {
                    this.counters[errorCounter]++;
                }
                error('Failed to collect %s (%d consecutive failures):', taskName, failed, e);
                const waitAfterFailure = resolveWaitTime(retryWaitTime, failed);
                debug('Waiting for %d ms after failure #%d', waitAfterFailure, failed);
                await abort.race(sleep(waitAfterFailure));
            }

            const waitForNext = Math.max(0, interval - (Date.now() - startTime));
            debug('Waiting for %d ms before collecting %s again', waitForNext, taskName);
            await abort.race(sleep(waitForNext));
        }
    }

    collectNodeInfo = async (abort: AbortHandle): Promise<OutputMessage[]> => {
        const { platformAdapter, ethClient } = this.config;
        const nodeInfo = await abort.race(platformAdapter.captureNodeInfo(ethClient));
        return [
            {
                type: 'nodeInfo',
                time: Date.now(),
                body: nodeInfo,
            },
        ];
    };

    collectNodeMetrics = async (abort: AbortHandle, time: number): Promise<OutputMessage[]> => {
        const { platformAdapter, ethClient } = this.config;
        const metrics = await abort.race(platformAdapter.captureNodeMetrics(ethClient, time));
        return Array.isArray(metrics) ? metrics : [metrics];
    };

    collectPendingTransactions = async (abort: AbortHandle, time: number): Promise<OutputMessage[]> => {
        const { platformAdapter, ethClient } = this.config;
        return await abort.race(platformAdapter.capturePendingTransactions(ethClient, time));
    };

    private async startCollectingNodeInfo() {
        if (!this.config.nodeInfo.enabled) {
            debug('Node info collection is disabled');
            return;
        }
        await this.periodicallyCollect(
            this.collectNodeInfo,
            'node info',
            this.config.nodeInfo.collectInterval,
            this.config.nodeInfo.retryWaitTime,
            this.aggregates.infoCollectDuration,
            'infoCollectCount',
            'infoErrorCount'
        );
    }

    private async startCollectingNodeMetrics() {
        if (!this.config.nodeMetrics.enabled) {
            debug('Node metrics collection is disabled');
            return;
        }
        await this.periodicallyCollect(
            this.collectNodeMetrics,
            'node metrics',
            this.config.nodeMetrics.collectInterval,
            this.config.nodeMetrics.retryWaitTime,
            this.aggregates.metricsCollectDuration,
            'metricsCollectCount',
            'metricsErrorCount'
        );
    }

    private async startCollectingPendingTransactions() {
        if (!this.config.pendingTx.enabled) {
            debug('Pending transaction collection is disabled');
            return;
        }

        const { platformAdapter, ethClient } = this.config;
        const pendingTxSupported = await platformAdapter.supportsPendingTransactions(ethClient);
        if (!pendingTxSupported) {
            warn(
                'Collection of pending transactions is not supported by the ethereum node %s (platform %s)',
                ethClient.transport.source,
                platformAdapter.name
            );
        }

        await this.periodicallyCollect(
            this.collectPendingTransactions,
            'pending txs',
            this.config.pendingTx.collectInterval,
            this.config.pendingTx.retryWaitTime,
            this.aggregates.pendingtxCollectDuration,
            'pendingTxCollectCount',
            'pendingTxErrorCount'
        );
    }

    public flushStats() {
        const stats = {
            ...this.counters,
            ...Object.fromEntries(Object.entries(this.aggregates).map(([name, agg]) => [name, agg.flush(name)])),
        };
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
