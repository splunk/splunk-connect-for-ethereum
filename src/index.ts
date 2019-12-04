import { Command } from '@oclif/command';
import debugModule from 'debug';
import { BlockWatcher } from './block';
import { BlockRangeCheckpoint } from './checkpoint';
import { CLI_FLAGS } from './cliflags';
import { defaultSourcetypes, SplunkHecConfig } from './config';
import { BatchedEthereumClient } from './eth/client';
import { HttpTransport } from './eth/http';
import { HecClient } from './hec';
import { HecOutput } from './output';
import { createModuleDebug, enableTraceLogging } from './utils/debug';
import { shutdownAll } from './utils/resource';
import { waitForSignal } from './utils/signal';
import { AbiDecoder } from './abi';

const { debug, error, info } = createModuleDebug('cli');

class Ethlogger extends Command {
    static description = 'Etherum Logger for Splunk';
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

        try {
            const hecConfig: SplunkHecConfig = {
                url: flags['hec-url'],
                token: flags['hec-token'], // 'e3822da6-6024-484b-979d-26664c2e7515',
                validateCertificate: false,
                sourcetypes: defaultSourcetypes,
                defaultMetadata: {
                    host: 'lando',
                    source: 'ethlogger',
                },
                metricsIndex: 'somemetrics',
            };

            const hec = new HecClient(hecConfig);
            const output = new HecOutput(hec, hecConfig);

            const checkpoints = new BlockRangeCheckpoint({
                path: 'checkpoints.json',
            });

            await checkpoints.initialize();

            const transport = new HttpTransport({
                url: 'http://localhost:22000',
            });

            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });

            const abiDecoder = new AbiDecoder();
            await abiDecoder.loadAbiDir('./test/abi');

            const blockWatcher = new BlockWatcher({
                checkpoints,
                ethClient: client,
                output,
                abiDecoder,
                startAt: 'genesis',
            });

            await Promise.race([blockWatcher.start(), waitForSignal('SIGINT')]);
            info('Recieved signal, proceeding with shutdown sequence');
            const cleanShutdown = await shutdownAll([abiDecoder, blockWatcher, checkpoints, hec], 10_000);
            info('Shutdown complete.');
            process.exit(cleanShutdown ? 0 : 2);
            return;
        } catch (e) {
            error('FATAL: ', e);
            process.exit(1);
            return;
        }
    }
}

export = Ethlogger;
