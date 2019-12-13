import { flags } from '@oclif/command';
import { StartBlock } from './block';

export const CLI_FLAGS = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    debug: flags.boolean({
        description: 'Enable debug log output',
    }),
    trace: flags.boolean({
        description:
            'Enable trace output (very, very verbose). ' +
            'Output will include raw payloads send send and received via JSON RPC and HEC',
        exclusive: ['debug'],
    }),

    'hec-url': flags.string({
        env: 'SPLUNK_HEC_URL',
        description:
            'URL to connect to Splunk HTTP Event Collector. ' +
            'You can either specify just the base URL (without path) ' +
            'and the default path will automatically appended or a full URL.',
        required: true,
    }),
    'hec-token': flags.string({
        env: 'SPLUNK_HEC_TOKEN',
        description: 'Token to authenticate against Splunk HTTP Event Collector',
        required: true,
    }),

    'eth-rpc-url': flags.string({
        env: 'ETH_RPC_URL',
        description: 'URL to reach the target ethereum node. Supported format is currently only HTTP(s) for JSON RPC',
        required: true,
        // and WS(s) for websocket connections.
        // 'Other arguments are interpreted as IPC and refer to a local path in the filesystem.',
    }),

    'eth-abi-dir': flags.string({
        env: 'ABI_DIR',
        description: 'Directory containing ABI ',
    }),

    'start-at-block': flags.option<StartBlock>({
        env: 'START_AT_BLOCK',
        multiple: false,
        helpValue: 'genesis|latest|<number>',
        description:
            '[default: genesis] First block to start ingesting from. ' +
            'Possible values are "genesis", "latest", an absolute block number ' +
            'or a negative number describing how many blocks before the latest one to start at.',
        parse: s => {
            if (s === 'genesis' || s === 'latest') {
                return s;
            }
            const n = parseInt(s, 10);
            if (isNaN(n)) {
                throw new Error(`Invalid start block: ${JSON.stringify(s)}`);
            }
            if (n % 1 !== 0) {
                throw new Error(`Invalid start block: ${JSON.stringify(s)} - block number must be an integer`);
            }
            return n;
        },
    }),

    'network-name': flags.string({
        env: 'NETWORK_NAME',
        description: 'The network name will be attached to all events sent to Splunk',
    }),

    // 'quorum-support': flags.boolean({
    //     env: 'QUORUM',
    //     description: 'Enable quorum compatibility',
    // }),
};
