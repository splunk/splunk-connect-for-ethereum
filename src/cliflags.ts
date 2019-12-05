import { flags } from '@oclif/command';

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

    // 'quorum-support': flags.boolean({
    //     env: 'QUORUM',
    //     description: 'Enable quorum compatibility',
    // }),
};
