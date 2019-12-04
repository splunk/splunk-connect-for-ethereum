import { flags } from '@oclif/command';

export const CLI_FLAGS = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    debug: flags.boolean({
        description: 'Enable debug log output',
    }),
    trace: flags.boolean({
        description: 'Enable trace output (very, very verbose)',
        exclusive: ['debug'],
    }),

    'hec-url': flags.string({
        env: 'SPLUNK_HEC_URL',
        required: true,
    }),
    'hec-token': flags.string({
        env: 'SPLUNK_HEC_TOKEN',
        required: true,
    }),

    // 'eth-rpc-url': flags.string({
    //     env: 'ETH_RPC_URL',
    //     description:
    //         'URL to reach the target ethereum node. ' +
    //         'Supported formats include HTTP(s) for JSON RPC and WS(s) for websocket connections. ' +
    //         'Other arguments are interpreted as IPC and refer to a local path in the filesystem.',
    // }),

    // 'eth-ws-url': flags.string({
    //     env: 'ETH_WS_URL',
    //     description:
    //         'Websocket URL - can be used in addition to the eth-rpc-url and will be used ' +
    //         'for subscibing to updates from the node.',
    // }),

    // 'web3-connection-timeout': flags.string({
    //     env: 'WEB3_CONN_TIMEOUT',
    // }),

    // 'abi-dir': flags.string({
    //     env: 'ABI_DIR',
    //     description: 'Directory containing ABI ',
    // }),

    // 'abi-etherscan-api-key': flags.string({
    //     env: 'ETHERSCAN_API_KEY',
    //     description: 'API key for downloading ABIs, register for a token at https://etherscan.io/apis',
    // }),

    // 'quorum-support': flags.boolean({
    //     env: 'QUORUM',
    //     description: 'Enable quorum compatibility',
    // }),
};
