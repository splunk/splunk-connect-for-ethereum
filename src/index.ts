import { Command } from '@oclif/command';
import debugModule from 'debug';
import { inspect } from 'util';
import { AbiRepository } from './abi/repo';
import { BlockWatcher } from './blockwatcher';
import { Checkpoint } from './checkpoint';
import { CLI_FLAGS } from './cliflags';
import { ConfigError, loadEthloggerConfig, EthloggerConfig } from './config';
import { ContractInfo } from './abi/contract';
import { BatchedEthereumClient, EthereumClient } from './eth/client';
import { HttpTransport } from './eth/http';
import { HecClient } from './hec';
import { introspectTargetNodePlatform } from './introspect';
import { substituteVariablesInHecConfig } from './meta';
import { NodeStatsCollector } from './nodestats';
import { createOutput } from './output';
import { ABORT } from './utils/abort';
import { createModuleDebug, enableTraceLogging } from './utils/debug';
import LRUCache from './utils/lru';
import { ManagedResource, shutdownAll } from './utils/resource';
import { waitForSignal } from './utils/signal';
import { InternalStatsCollector } from './utils/stats';
import { checkHealthState, HealthStateMonitor } from './health';

const { debug, error, info } = createModuleDebug('cli');

class Ethlogger extends Command {
    static description = 'Splunk Connect for Ethereum';
    static flags = CLI_FLAGS;

    private resources: ManagedResource[] = [];

    async run() {
        const { flags } = this.parse(Ethlogger);

        if (flags.debug || flags.trace) {
            debugModule.enable('ethlogger:*');
            debug('Enabled debug logging for ethlogger');
        }
        if (flags.trace) {
            enableTraceLogging();
        }
        if (flags['health-check']) {
            const healthy = await checkHealthState();
            if (healthy) {
                info('Ethlogger process appears to be healthy');
                process.exit(0);
            } else {
                error('Ethlogger process is unhealthy');
                process.exit(1);
            }
        }

        try {
            if (flags['print-config']) {
                const config = await loadEthloggerConfig(flags, true);
                debug('Printing config');
                // eslint-disable-next-line no-console
                console.log(inspect(config, { depth: 10, colors: true, showHidden: false, compact: false }));
                await loadEthloggerConfig(flags);
                return;
            }
            const config = await loadEthloggerConfig(flags);
            const health = new HealthStateMonitor();
            health.start();
            this.resources.push(health);

            // Run ethlogger until we receive ctrl+c or hit an unrecoverable error
            await Promise.race([this.startEthlogger(config), waitForSignal('SIGINT'), waitForSignal('SIGTERM')]);

            info('Recieved signal, proceeding with shutdown sequence');
            const cleanShutdown = await shutdownAll(this.resources, 10_000);
            info('Shutdown complete.');
            process.exit(cleanShutdown ? 0 : 2);
        } catch (e) {
            if (!(e instanceof ConfigError)) {
                error('FATAL:', e);
            }
            this.error(e.message, { exit: 1 });
        } finally {
            await shutdownAll(this.resources, 10_000).catch(e => {
                error('Failed to shut down resources', e);
            });
        }
    }

    async startEthlogger(config: EthloggerConfig): Promise<any> {
        const addResource = <R extends ManagedResource>(r: R): R => {
            this.resources.unshift(r);
            return r;
        };

        const transport = new HttpTransport(config.eth.url, config.eth.http);
        const client =
            config.eth.client.maxBatchSize > 1
                ? new BatchedEthereumClient(transport, {
                      maxBatchSize: config.eth.client.maxBatchSize,
                      maxBatchTime: config.eth.client.maxBatchTime,
                  })
                : new EthereumClient(transport);
        const platformAdapter = await introspectTargetNodePlatform(client, config.eth.chain, config.eth.network);

        info(
            'Detected node platform=%o protocol=%d chainId=%d networkId=%d chain=%s network=%s',
            platformAdapter.name,
            platformAdapter.protocolVersion,
            platformAdapter.chainId,
            platformAdapter.networkId,
            platformAdapter.networkName,
            platformAdapter.chainName
        );

        substituteVariablesInHecConfig(config, {
            ethloggerVersion: this.config.version,
            platformAdapter,
            transportOriginHost: transport.originHost,
        });

        const baseHec = new HecClient(config.hec.default);
        const output = await createOutput(config, baseHec);
        addResource(output);

        const internalStatsCollector = new InternalStatsCollector({
            collect: config.internalMetrics.enabled,
            collectInterval: config.internalMetrics.collectInterval,
            dest: baseHec.clone(config.hec.internal),
            basePrefix: 'ethlogger.internal',
        });
        addResource(internalStatsCollector);
        internalStatsCollector.addSource(transport, 'ethTransport');
        internalStatsCollector.addSource(output, 'output');

        const checkpoints = addResource(
            new Checkpoint({
                path: config.checkpoint.filename,
                saveInterval: config.checkpoint.saveInterval,
            })
        );
        await checkpoints.initialize();

        const abiRepo = new AbiRepository(config.abi);
        addResource(abiRepo);
        await abiRepo.initialize();

        const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({
            maxSize: config.contractInfo.maxCacheEntries,
        });
        internalStatsCollector.addSource(contractInfoCache, 'contractInfoCache');

        const nodeStatsCollector = new NodeStatsCollector({
            ethClient: client,
            platformAdapter,
            output,
            nodeMetrics: config.nodeMetrics,
            nodeInfo: config.nodeInfo,
            pendingTx: config.pendingTx,
        });
        addResource(nodeStatsCollector);
        internalStatsCollector.addSource(nodeStatsCollector, 'nodeStatsCollector');

        let blockWatcher: BlockWatcher | null = null;

        if (config.blockWatcher.enabled) {
            blockWatcher = new BlockWatcher({
                checkpoints,
                ethClient: client,
                output,
                abiRepo: abiRepo,
                startAt: config.blockWatcher.startAt,
                contractInfoCache,
                chunkSize: config.blockWatcher.blocksMaxChunkSize,
                maxParallelChunks: config.blockWatcher.maxParallelChunks,
                pollInterval: config.blockWatcher.pollInterval,
            });
            addResource(blockWatcher);
            internalStatsCollector.addSource(blockWatcher, 'blockWatcher');
        } else {
            debug('Block watcher is disabled');
        }

        internalStatsCollector.start();

        return Promise.all(
            [blockWatcher?.start(), nodeStatsCollector.start()].map(p =>
                p?.catch(e => {
                    if (e !== ABORT) {
                        error('Error in ethlogger task:', e);
                        return Promise.reject(e);
                    }
                })
            )
        );
    }
}

export = Ethlogger;
