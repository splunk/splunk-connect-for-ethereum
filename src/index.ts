import { Command } from '@oclif/command';
import debugModule from 'debug';
import { AbiDecoder } from './abi';
import { BlockWatcher } from './block';
import { BlockRangeCheckpoint } from './checkpoint';
import { CLI_FLAGS } from './cliflags';
import { defaultSourcetypes, SplunkHecConfig } from './config';
import { BatchedEthereumClient } from './eth/client';
import { HttpTransport } from './eth/http';
import { HecClient } from './hec';
import { HecOutput } from './output';
import { createModuleDebug, enableTraceLogging } from './utils/debug';
import { shutdownAll, ManagedResource } from './utils/resource';
import { waitForSignal } from './utils/signal';
import LRUCache from './utils/lru';
import { ContractInfo } from './contract';
import { StatsCollector } from './utils/stats';

const { debug, error, info } = createModuleDebug('cli');

class Ethlogger extends Command {
    static description = 'Splunk Connect for Ethereum and Quorum';
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
            const hecConfig: SplunkHecConfig = {
                url: flags['hec-url'],
                token: flags['hec-token'],
                validateCertificate: false,
                sourcetypes: defaultSourcetypes,
                multipleMetricFormatEnabled: true,
                defaultMetadata: {
                    host: 'lando',
                    source: 'ethlogger',
                },
                metricsIndex: 'somemetrics',
            };

            const hec = new HecClient(hecConfig);
            const output = new HecOutput(hec, hecConfig);
            addResource(output);

            const statsCollector = new StatsCollector({
                collectInterval: 1000,
                dest: hec.clone({
                    defaultMetadata: {
                        host: process.env.HOST || process.env.HOSTNAME,
                        source: 'ethlogger://internals',
                        sourcetype: 'ethlogger:stats',
                        index: 'somemetrics',
                    },
                    flushTime: 10000,
                    multipleMetricFormatEnabled: true,
                }),
                basePrefix: 'ethlogger',
                fields: {
                    version: this.config.version,
                    nodeVersion: process.version,
                },
            });
            addResource(statsCollector);
            statsCollector.addSource(hec, 'hec');

            const checkpoints = addResource(
                new BlockRangeCheckpoint({
                    path: 'checkpoints.json',
                })
            );
            await checkpoints.initialize();

            const transport = new HttpTransport({
                url: flags['eth-rpc-url'],
            });
            statsCollector.addSource(transport, 'ethTransport');

            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });

            let abiDecoder;
            if (flags['eth-abi-dir']) {
                abiDecoder = new AbiDecoder();
                resources.unshift(abiDecoder);
                await abiDecoder.loadAbiDir(flags['eth-abi-dir']);
            }

            const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 25_000 });
            statsCollector.addSource(contractInfoCache, 'contractInfoCache');

            const blockWatcher = new BlockWatcher({
                checkpoints,
                ethClient: client,
                output,
                abiDecoder,
                startAt: 'genesis',
                contractInfoCache,
            });
            resources.unshift(blockWatcher);
            statsCollector.addSource(blockWatcher, 'blockWatcher');

            statsCollector.start();

            await Promise.race([blockWatcher.start(), waitForSignal('SIGINT')]);
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
