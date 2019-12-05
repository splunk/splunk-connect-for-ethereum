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

const { debug, error, info } = createModuleDebug('cli');

class Ethlogger extends Command {
    static description = 'Etherum Logger for Splunk'; // The name we want to go with is Splunk Connect for Ethereum...
    static flags = CLI_FLAGS;

    async run() {
        const { flags } = this.parse(Ethlogger); // If we rename it I don't know how much work it will be to rename the code...

        if (flags.debug || flags.trace) {
            // We should think about what we name it here as well, maybe sc-eth or something...
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
                token: flags['hec-token'], // 'e3822da6-6024-484b-979d-26664c2e7515',
                validateCertificate: false,
                sourcetypes: defaultSourcetypes,
                // consider configuring this using something like:
                // host: eth node host dns/ip
                // source: ethlogger://<networkid>/<ethlogger hostname>
                // enode: optional field if the eth node has the correct json rpc endpoint available
                defaultMetadata: {
                    host: 'lando',
                    source: 'ethlogger',
                },
                metricsIndex: 'somemetrics',
            };

            const hec = new HecClient(hecConfig);
            const output = new HecOutput(hec, hecConfig);
            addResource(output);

            const checkpoints = addResource(
                new BlockRangeCheckpoint({
                    path: 'checkpoints.json',
                })
            );
            await checkpoints.initialize();

            const transport = new HttpTransport({
                url: flags['eth-rpc-url'],
            });

            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 5 });

            let abiDecoder;
            if (flags['eth-abi-dir']) {
                abiDecoder = new AbiDecoder();
                resources.unshift(abiDecoder);
                await abiDecoder.loadAbiDir(flags['eth-abi-dir']);
            }

            const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 25_000 });

            const blockWatcher = new BlockWatcher({
                checkpoints,
                ethClient: client,
                output,
                abiDecoder,
                startAt: 'genesis',
                contractInfoCache,
            });
            resources.unshift(blockWatcher);

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
