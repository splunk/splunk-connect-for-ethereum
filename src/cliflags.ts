import { flags } from '@oclif/command';
import { StartBlock } from './blockwatcher';

export const CLI_FLAGS = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    debug: flags.boolean({
        description: 'Enable debug log output',
    }),
    trace: flags.boolean({
        description:
            'Enable trace output (very, very verbose). ' +
            'Output will include raw payloads sent and received via JSON RPC and HEC',
        exclusive: ['debug'],
    }),

    'print-config': flags.boolean({
        description:
            'Causes ethlogger to simply print the configuration merged from config file and CLI flags and exit.',
    }),
    'health-check': flags.boolean({
        hidden: true,
        description:
            'Performs health check for a running ethlogger process by examining the state file created by that process',
    }),

    'config-file': flags.string({
        char: 'c',
        description:
            'Ethlogger configuration file to use. If not specfified ethlogger will look for a file ' +
            'called ethlogger.yaml or ethlogger.json in the current working directory',
    }),

    'collect-blocks': flags.boolean({
        allowNo: true,
        env: 'COLLECT_BLOCKS',
        description:
            'Enables ethereum block watcher, ingesting blocks, transactions, event logs ' +
            'and ABI-decoded information from method calls and event logs',
    }),
    'collect-node-metrics': flags.boolean({
        allowNo: true,
        env: 'COLLECT_NODE_METRICS',
        description: 'Enables collection of node metrics',
    }),
    'collect-node-info': flags.boolean({
        allowNo: true,
        env: 'COLLECT_NODE_INFO',
        description: 'Enables collection of node info events',
    }),
    'collect-pending-transactions': flags.boolean({
        allowNo: true,
        env: 'COLLECT_PENDING_TX',
        description: 'Enables collection of pending transactions',
    }),
    'collect-internal-metrics': flags.boolean({
        allowNo: true,
        env: 'COLLECT_INTERNAL_METRICS',
        description: 'Enables collection of ethlogger-internal metrics',
    }),

    'hec-url': flags.string({
        env: 'SPLUNK_HEC_URL',
        description:
            'URL to connect to Splunk HTTP Event Collector. ' +
            'You can either specify just the base URL (without path) ' +
            'and the default path will automatically appended or a full URL',
    }),
    'hec-token': flags.string({
        env: 'SPLUNK_HEC_TOKEN',
        description: 'Token to authenticate against Splunk HTTP Event Collector',
    }),
    'hec-reject-invalid-certs': flags.boolean({
        allowNo: true,
        env: 'SPLUNK_HEC_REJECT_INVALID_CERTS',
        description:
            'Disable to allow HEC client to connect to HTTPS without rejecting invalid (self-signed) certificates',
    }),
    'hec-events-index': flags.string({
        env: 'SPLUNK_EVENTS_INDEX',
        description:
            'Splunk index to send events to. You can alternatively use separate HEC tokens to correctly route your data',
    }),
    'hec-metrics-index': flags.string({
        env: 'SPLUNK_METRICS_INDEX',
        description:
            'Splunk index to send metrics to. You can alternatively use separate HEC tokens to correctly route your data',
    }),
    'hec-internal-index': flags.string({
        env: 'SPLUNK_INTERNAL_INDEX',
        description:
            'Splunk index to send internal metrics to. You can alternatively use separate HEC tokens to correctly route your data',
    }),

    'hec-events-token': flags.string({
        env: 'SPLUNK_EVENTS_HEC_TOKEN',
        description:
            'HEC token to use for sending events. You can alternatively configure different indexes to correctly route your data',
    }),
    'hec-metrics-token': flags.string({
        env: 'SPLUNK_METRICS_HEC_TOKEN',
        description:
            'HEC token to use for sending metrics. You can alternatively configure different indexes to correctly route your data',
    }),
    'hec-internal-token': flags.string({
        env: 'SPLUNK_INTERNAL_HEC_TOKEN',
        description:
            'HEC token to use for sending internal metrics. You can alternatively configure different indexes to correctly route your data',
    }),

    'eth-rpc-url': flags.string({
        env: 'ETH_RPC_URL',
        description: 'URL to reach the target ethereum node. Supported format is currently only HTTP(s) for JSON RPC',
    }),
    'eth-reject-invalid-certs': flags.boolean({
        allowNo: true,
        env: 'ETH_REJECT_INVALID_CERTS',
        description:
            'Disable to allow ethereum client to connect to HTTPS without rejecting invalid (self-signed) certificates',
    }),

    'abi-dir': flags.string({
        env: 'ABI_DIR',
        description: 'Directory containing ABI definitions (JSON files). This directory will be searched recursively',
    }),

    'start-at-block': flags.option<StartBlock>({
        env: 'START_AT_BLOCK',
        multiple: false,
        helpValue: 'genesis|latest|<number>',
        description:
            'First block to start ingesting from. ' +
            'Possible values are "genesis", "latest", an absolute block number ' +
            'or a negative number describing how many blocks before the latest one to start at',
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

    'reject-invalid-certs': flags.boolean({
        env: 'REJECT_INVALID_CERTS',
        allowNo: true,
        description:
            'Disable to allow all HTTP clients (HEC and ETH) to connect to HTTPS without rejecting invalid (self-signed) certificates',
    }),

    'network-name': flags.string({
        env: 'NETWORK_NAME',
        description:
            'The network name will be attached to all events sent to Splunk. This is typically either "mainnet" or "testnet".',
    }),
    'chain-name': flags.string({
        env: 'CHAIN_NAME',
        description: 'The name of the chain that will be attached to all events sent to Splunk',
    }),
};
