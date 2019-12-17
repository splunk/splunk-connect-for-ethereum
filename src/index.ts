import { Command } from '@oclif/command';
import debugModule from 'debug';
import { inspect } from 'util';
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
import { substituteVariablesInHecMetadata } from './meta';
import { NodeStatsCollector } from './nodestats';
import { createOutput } from './output';
import { ABORT } from './utils/abort';
import { createModuleDebug, enableTraceLogging } from './utils/debug';
import LRUCache from './utils/lru';
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
                const config = await loadEthloggerConfig(flags, true);
                debug('Printing config');
                // eslint-disable-next-line no-console
                console.log(inspect(config, { depth: 10, colors: true, showHidden: false, compact: false }));
                await loadEthloggerConfig(flags);
                return;
            }
            const config = await loadEthloggerConfig(flags);

            const transport = new HttpTransport(config.eth.url, config.eth.http);
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client, flags['network-name']);

            info(
                'Detected node platform=%o network=%d protocol=%d',
                platformAdapter.name,
                platformAdapter.networkId,
                platformAdapter.protocolVersion
            );

            substituteVariablesInHecMetadata(config, {
                ethloggerVersion: this.config.version,
                platformAdapter,
                transportOriginHost: transport.originHost,
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
            internalStatsCollector.addSource(output, 'output');

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
