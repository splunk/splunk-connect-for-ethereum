import { Command } from '@oclif/command';
import debugModule from 'debug';
import { AbiRepository } from './abi';
import { BlockWatcher } from './blockwatcher';
import { Checkpoint } from './checkpoint';
import { CLI_FLAGS } from './cliflags';
import { ConfigError, loadEthloggerConfig } from './config';
import { ContractInfo } from './contract';
import { BatchedEthereumClient } from './eth/client';
import { HttpTransport } from './eth/http';
import { HecClient } from './hec';
import { introspectTargetNodePlatform } from './introspect';
import { NodeStatsCollector } from './nodestats';
import { createOutput } from './output';
import { ABORT } from './utils/abort';
import { createModuleDebug, enableTraceLogging } from './utils/debug';
import LRUCache from './utils/lru';
import { removeEmtpyValues, subsituteVariables } from './utils/obj';
import { ManagedResource, shutdownAll } from './utils/resource';
import { waitForSignal } from './utils/signal';
import { InternalStatsCollector } from './utils/stats';

const { debug, error, info } = createModuleDebug('cli');

class Ethlogger extends Command {
    static description = 'Splunk Connect for Ethereum';
    static flags = CLI_FLAGS;

    async run() {
        const { flags } = this.parse(Ethlogger);

        if (flags.debug || flags.trace) {
            debugModule.enable('ethlogger:*');
            debug('Enabled debug logging for ethlogger');
        }
        if (flags.trace) {
            enableTraceLogging();
        }

        const resources: ManagedResource[] = [];

        const addResource = <R extends ManagedResource>(r: R): R => {
            resources.unshift(r);
            return r;
        };

        try {
            if (flags['print-config']) {
                const config = await loadEthloggerConfig(flags['config-file'], flags, true);
                info('CONFIG: %O', config);
                await loadEthloggerConfig(flags['config-file'], flags);
                return;
            }
            const config = await loadEthloggerConfig('ethlogger.yaml', flags);

            const transport = new HttpTransport(config.eth.url, config.eth.http);
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client, flags['network-name']);

            info(
                'Detected node platform=%o network=%d protocol=%d',
                platformAdapter.name,
                platformAdapter.networkId,
                platformAdapter.protocolVersion
            );

            const metaVariables = removeEmtpyValues({
                HOSTNAME: process.env.HOSTNAME || process.env.HOST,
                ENODE: platformAdapter.enode,
                PLATFORM: platformAdapter.name,
                NETWORK_ID: String(platformAdapter.networkId),
                NETWORK: config.eth.network, // TODO guess known network names
                PID: String(process.pid),
                VERSION: this.config.version,
                NODE_VERSION: process.version,
                TRANSPORT_ORIGIN: transport.originHost,
            });

            Object.entries(config.hec).forEach(([name, cfg]) => {
                debug('Replacing metadata variables in HEC config %s', name);
                if (cfg && cfg.defaultFields != null) {
                    cfg.defaultFields = subsituteVariables(cfg.defaultFields, metaVariables);
                }
                if (cfg && cfg.defaultMetadata != null) {
                    cfg.defaultMetadata = subsituteVariables(cfg.defaultMetadata, metaVariables);
                }
                debug('Replaced metadata variables in HEC config: %O', {
                    defaultFields: cfg?.defaultFields,
                    defaultMetadata: cfg?.defaultMetadata,
                });
            });

            const baseHec = new HecClient(config.hec.default);
            const output = createOutput(config, baseHec);
            addResource(output);

            const internalStatsCollector = new InternalStatsCollector({
                collect: config.internalMetrics.enabled,
                collectInterval: config.internalMetrics.collectInterval,
                dest: baseHec.clone(config.hec.internal),
                basePrefix: 'ethlogger.internal',
            });
            addResource(internalStatsCollector);
            internalStatsCollector.addSource(transport, 'ethTransport');
            internalStatsCollector.addSource(baseHec, 'hec');

            const checkpoints = addResource(
                new Checkpoint({
                    path: config.checkpoint.filename,
                    saveInterval: config.checkpoint.saveInterval,
                })
            );
            await checkpoints.initialize();

            const abiRepo = new AbiRepository();
            resources.unshift(abiRepo);
            if (config.abi.directory != null) {
                await abiRepo.loadAbiDir(config.abi.directory!);
            }

            const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({
                maxSize: config.contractInfo.maxCacheEntries,
            });
            internalStatsCollector.addSource(contractInfoCache, 'contractInfoCache');

            const nodeStatsCollector = new NodeStatsCollector({
                ethClient: client,
                platformAdapter,
                abiRepo,
                contractInfoCache,
                output,
                metricsEnabled: config.nodeMetrics.enabled,
                metricsInterval: config.nodeMetrics.collectInterval,
                infoEnabled: config.nodeInfo.enabled,
                infoInterval: config.nodeInfo.collectInterval,
                metricsRetryWaitTime: config.nodeInfo.retryWaitTime,
            });
            addResource(nodeStatsCollector);
            internalStatsCollector.addSource(nodeStatsCollector, 'nodeStatsCollector');

            const blockWatcher = new BlockWatcher({
                checkpoints,
                ethClient: client,
                output,
                abiRepo: abiRepo,
                startAt: config.blockWatcher.startAt,
                contractInfoCache,
                chunkSize: config.blockWatcher.blocksMaxChunkSize,
                pollInterval: config.blockWatcher.pollInterval,
            });
            resources.unshift(blockWatcher);
            internalStatsCollector.addSource(blockWatcher, 'blockWatcher');

            internalStatsCollector.start();

            await Promise.race([
                Promise.all(
                    [blockWatcher.start(), nodeStatsCollector.start()].map(p =>
                        p.catch(e => {
                            if (e !== ABORT) {
                                error('Error in ethlogger task:', e);
                                return Promise.reject(e);
                            }
                        })
                    )
                ),
                waitForSignal('SIGINT'),
            ]);

            info('Recieved signal, proceeding with shutdown sequence');
            const cleanShutdown = await shutdownAll(resources, 10_000);
            info('Shutdown complete.');
            process.exit(cleanShutdown ? 0 : 2);
        } catch (e) {
            if (!(e instanceof ConfigError)) {
                error('FATAL: ', e);
            }
            this.error(e.message, { exit: 1 });
        }
    }
}

export = Ethlogger;
