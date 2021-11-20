import { Command } from '@oclif/command';
import debugModule from 'debug';
import { inspect } from 'util';
import { ContractInfo, getContractInfo } from './abi/contract';
import { AbiRepository } from './abi/repo';
import { BlockWatcher } from './blockwatcher';
import { State } from './state';
import { CLI_FLAGS } from './cliflags';
import { ConfigError, EthloggerConfig, loadEthloggerConfig } from './config';
import { BatchedEthereumClient, EthereumClient } from './eth/client';
import { HttpTransport } from './eth/http';
import { checkHealthState, HealthStateMonitor } from './health';
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
import { BalanceWatcher } from './balancewatcher';
import { NFTWatcher } from './nftwatcher';

const { debug, error, info } = createModuleDebug('cli');

class Ethlogger extends Command {
    static description =
        'Ethlogger is an agent to gather metrics and blockchain information from an Ethereum node ' +
        'and ingest it in Splunk via its HTTP Event Collector. It is part of Splunk Connect for Ethereum.';
    static usage = '--rpc-url=<rpc-url> [options]';
    static flags = CLI_FLAGS;

    private resources: ManagedResource[] = [];

    async run() {
        if (process.env.ETHLOGGER_GIT_COMMIT != null) {
            this.config.userAgent = `${this.config.userAgent} git-sha=${process.env.ETHLOGGER_GIT_COMMIT}`;
        }
        const { flags } = this.parse(Ethlogger);

        if (flags.debug) {
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

            if (flags['debug-contract-info'] != null) {
                const addr = flags['debug-contract-info'];
                info(`Determining info for contract at address=%s`, addr);
                enableTraceLogging('ethlogger:abi:*');
                const abiRepo = new AbiRepository(config.abi);
                await abiRepo.initialize();
                const transport = new HttpTransport(config.eth.url, config.eth.http);
                const client = new EthereumClient(transport);

                const contractInfo = await getContractInfo(
                    addr,
                    client,
                    (sig: string) => abiRepo.getMatchingSignature(sig),
                    (address: string, fingerprint: string) =>
                        abiRepo.getContractByAddress(address)?.contractName ??
                        abiRepo.getContractByFingerprint(fingerprint)?.contractName
                );

                info('Contract info: %O', contractInfo);
                return;
            }

            const health = new HealthStateMonitor();
            health.start();
            this.resources.push(health);

            info('Starting ethlogger version=%s', this.config.userAgent);

            // Run ethlogger until we receive ctrl+c or hit an unrecoverable error
            await Promise.race([this.startEthlogger(config), waitForSignal('SIGINT'), waitForSignal('SIGTERM')]);

            info('Received signal, proceeding with shutdown sequence');
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

        const state = new State({
            path: config.checkpoint.filename,
            saveInterval: config.checkpoint.saveInterval,
        });
        const checkpoints = addResource(state);
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
            peerInfo: config.peerInfo,
        });
        addResource(nodeStatsCollector);
        internalStatsCollector.addSource(nodeStatsCollector, 'nodeStatsCollector');

        let blockWatcher: BlockWatcher | null = null;

        if (config.blockWatcher.enabled) {
            blockWatcher = new BlockWatcher({
                checkpoint: state.getCheckpoint('main'),
                ethClient: client,
                output,
                abiRepo: abiRepo,
                config: config.blockWatcher,
                contractInfoCache,
                nodePlatform: platformAdapter,
            });
            addResource(blockWatcher);
            internalStatsCollector.addSource(blockWatcher, 'blockWatcher');
        } else {
            debug('Block watcher is disabled');
        }
        const balanceWatcherResources = [];

        for (const [name, balanceWatcherConfig] of config.balanceWatchers) {
            if (balanceWatcherConfig.enabled) {
                const balanceWatcher = new BalanceWatcher({
                    checkpoint: state.getCheckpoint(name),
                    ethClient: client,
                    output,
                    config: balanceWatcherConfig,
                    contractInfoCache,
                    nodePlatform: platformAdapter,
                });
                addResource(balanceWatcher);
                internalStatsCollector.addSource(balanceWatcher, 'balanceWatcher-' + name);
                balanceWatcherResources.push(balanceWatcher);
            }
        }

        const nftWatcherResources = [];

        for (const [name, nftWatcherConfig] of config.nftWatchers) {
            if (nftWatcherConfig.enabled) {
                const nftWatcher = new NFTWatcher({
                    checkpoint: state.getCheckpoint(name),
                    ethClient: client,
                    output,
                    config: nftWatcherConfig,
                    contractInfoCache,
                    nodePlatform: platformAdapter,
                });
                addResource(nftWatcher);
                internalStatsCollector.addSource(nftWatcher, 'nftWatcher-' + name);
                nftWatcherResources.push(nftWatcher);
            }
        }

        internalStatsCollector.start();

        return Promise.all(
            [
                blockWatcher?.start(),
                nodeStatsCollector.start(),
                ...balanceWatcherResources.map(b => b.start()),
                ...nftWatcherResources.map(b => b.start()),
            ].map(p =>
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
