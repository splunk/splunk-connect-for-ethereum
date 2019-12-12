import { Command } from '@oclif/command';
import debugModule from 'debug';
import { AbiRepository } from './abi';
import { BlockWatcher } from './block';
import { Checkpoint } from './checkpoint';
import { CLI_FLAGS } from './cliflags';
import { defaultSourcetypes, SplunkHecConfig } from './config';
import { ContractInfo } from './contract';
import { BatchedEthereumClient } from './eth/client';
import { HttpTransport } from './eth/http';
import { HecClient } from './hec';
import { introspectTargetNodePlatform } from './introspect';
import { NodeStatsCollector } from './nodestats';
import { HecOutput } from './output';
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
            const transport = new HttpTransport({
                url: flags['eth-rpc-url'],
            });
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client);

            info('Detected node platform %o', platformAdapter.name);

            const hecConfig: SplunkHecConfig = {
                url: flags['hec-url'],
                token: flags['hec-token'],
                validateCertificate: false,
                sourcetypes: defaultSourcetypes,
                multipleMetricFormatEnabled: true,
                defaultMetadata: {
                    host: platformAdapter.enode || transport.originHost,
                    source: 'ethlogger',
                },
                defaultFields: {
                    enode: platformAdapter.enode || undefined,
                    platform: platformAdapter.name,
                },
                eventIndex: 'hecevents',
                metricsIndex: 'somemetrics',
                internalMetricsIndex: 'somemetrics',
                metricsPrefix: 'eth',
            };

            const hec = new HecClient(hecConfig);
            const output = new HecOutput(hec, hecConfig);
            addResource(output);

            const internalStatsCollector = new InternalStatsCollector({
                collectInterval: 1000,
                dest: hec.clone({
                    defaultMetadata: {
                        host: process.env.HOST || process.env.HOSTNAME,
                        source: 'ethlogger:internal',
                        sourcetype: 'ethlogger:stats',
                        index: hecConfig.internalMetricsIndex,
                    },
                    defaultFields: {
                        version: this.config.version,
                        nodeVersion: process.version,
                        pid: process.pid,
                    },
                    flushTime: 5000,
                    multipleMetricFormatEnabled: true,
                }),
                basePrefix: 'ethlogger.internal',
            });
            addResource(internalStatsCollector);
            internalStatsCollector.addSource(transport, 'ethTransport');
            internalStatsCollector.addSource(hec, 'hec');

            const checkpoints = addResource(
                new Checkpoint({
                    path: 'checkpoints.json',
                })
            );
            await checkpoints.initialize();

            let abiRepo;
            if (flags['eth-abi-dir']) {
                abiRepo = new AbiRepository();
                resources.unshift(abiRepo);
                await abiRepo.loadAbiDir(flags['eth-abi-dir']);
            }

            const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 1000 });
            internalStatsCollector.addSource(contractInfoCache, 'contractInfoCache');

            const nodeStatsCollector = new NodeStatsCollector({
                ethClient: client,
                platformAdapter,
                abiRepo,
                contractInfoCache,
                output,
                statsInterval: 1000,
            });
            addResource(nodeStatsCollector);
            internalStatsCollector.addSource(nodeStatsCollector, 'nodeStatsCollector');

            const blockWatcher = new BlockWatcher({
                checkpoints,
                ethClient: client,
                output,
                abiRepo: abiRepo,
                startAt: 'genesis',
                contractInfoCache,
            });
            resources.unshift(blockWatcher);
            internalStatsCollector.addSource(blockWatcher, 'blockWatcher');

            internalStatsCollector.start();

            await Promise.race([
                Promise.all(
                    [blockWatcher.start(), nodeStatsCollector.start()].map(p =>
                        p.catch(e => {
                            error('Error in ethlogger task:', e);
                            return Promise.reject(e);
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
            error('FATAL: ', e);
            process.exit(1);
        }
    }
}

export = Ethlogger;
