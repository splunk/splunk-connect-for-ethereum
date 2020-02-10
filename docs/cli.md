# Splunk Connect for Ethereum (ethlogger) CLI

The ethlogger CLI tool is used to start and configure connections to the blockchain node and outputs. Command line flags or environment variables can be used to configure the CLI. Fine grained configuration options are available using the [config file](configuration.md). Note that CLI flags will take precedence over environment variables which, in turn, take precedence over configuration files.

## CLI Flags Reference

<!-- CLIREF -->

```
Splunk Connect for Ethereum

USAGE
  $ ethlogger

OPTIONS
  -c, --config-file=config-file
      Ethlogger configuration file to use. If not specfified ethlogger will look
      for a file called ethlogger.yaml or ethlogger.json in the current working
      directory

  -h, --help
      show CLI help

  -v, --version
      show CLI version

  --abi-dir=abi-dir
      Directory containing ABI definitions (JSON files). This directory will be
      searched recursively

  --chain-name=chain-name
      The name of the chain that will be attached to all events sent to Splunk

  --[no-]collect-blocks
      Enables ethereum block watcher, ingesting blocks, transactions, event logs
      and ABI-decoded information from method calls and event logs

  --[no-]collect-internal-metrics
      Enables collection of ethlogger-internal metrics

  --[no-]collect-node-info
      Enables collection of node info events

  --[no-]collect-node-metrics
      Enables collection of node metrics

  --[no-]collect-pending-transactions
      Enables collection of pending transactions

  --debug
      Enable debug log output

  --[no-]eth-reject-invalid-certs
      Disable to allow ethereum client to connect to HTTPS without rejecting
      invalid (self-signed) certificates

  --eth-rpc-url=eth-rpc-url
      URL to reach the target ethereum node. Supported format is currently only
      HTTP(s) for JSON RPC

  --hec-events-index=hec-events-index
      Splunk index to send events to. You can alternatively use separate HEC
      tokens to correctly route your data

  --hec-events-token=hec-events-token
      HEC token to use for sending events. You can alternatively configure
      different indexes to correctly route your data

  --hec-internal-index=hec-internal-index
      Splunk index to send internal metrics to. You can alternatively use separate
      HEC tokens to correctly route your data

  --hec-internal-token=hec-internal-token
      HEC token to use for sending internal metrics. You can alternatively
      configure different indexes to correctly route your data

  --hec-metrics-index=hec-metrics-index
      Splunk index to send metrics to. You can alternatively use separate HEC
      tokens to correctly route your data

  --hec-metrics-token=hec-metrics-token
      HEC token to use for sending metrics. You can alternatively configure
      different indexes to correctly route your data

  --[no-]hec-reject-invalid-certs
      Disable to allow HEC client to connect to HTTPS without rejecting invalid
      (self-signed) certificates

  --hec-token=hec-token
      Token to authenticate against Splunk HTTP Event Collector

  --hec-url=hec-url
      URL to connect to Splunk HTTP Event Collector. You can either specify just
      the base URL (without path) and the default path will automatically appended
      or a full URL

  --network-name=network-name
      The network name will be attached to all events sent to Splunk. This is
      typically either "mainnet" or "testnet".

  --print-config
      Causes ethlogger to simply print the configuration merged from config file
      and CLI flags and exit.

  --[no-]reject-invalid-certs
      Disable to allow all HTTP clients (HEC and ETH) to connect to HTTPS without
      rejecting invalid (self-signed) certificates

  --start-at-block=genesis|latest|<number>
      First block to start ingesting from. Possible values are "genesis",
      "latest", an absolute block number or a negative number describing how many
      blocks before the latest one to start at

  --trace
      Enable trace output (very, very verbose). Output will include raw payloads
      sent and received via JSON RPC and HEC
```

<!-- CLIREF-END -->

## Environment Variables

<!-- ENVREF -->

| Environment Variable              | Type      | Description                                                                                                                                                                              |
| --------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `COLLECT_BLOCKS`                  | `boolean` | Enables ethereum block watcher, ingesting blocks, transactions, event logs and ABI-decoded information from method calls and event logs                                                  |
| `COLLECT_NODE_METRICS`            | `boolean` | Enables collection of node metrics                                                                                                                                                       |
| `COLLECT_NODE_INFO`               | `boolean` | Enables collection of node info events                                                                                                                                                   |
| `COLLECT_PENDING_TX`              | `boolean` | Enables collection of pending transactions                                                                                                                                               |
| `COLLECT_INTERNAL_METRICS`        | `boolean` | Enables collection of ethlogger-internal metrics                                                                                                                                         |
| `SPLUNK_HEC_URL`                  | `string`  | URL to connect to Splunk HTTP Event Collector. You can either specify just the base URL (without path) and the default path will automatically appended or a full URL                    |
| `SPLUNK_HEC_TOKEN`                | `string`  | Token to authenticate against Splunk HTTP Event Collector                                                                                                                                |
| `SPLUNK_HEC_REJECT_INVALID_CERTS` | `boolean` | Disable to allow HEC client to connect to HTTPS without rejecting invalid (self-signed) certificates                                                                                     |
| `SPLUNK_EVENTS_INDEX`             | `string`  | Splunk index to send events to. You can alternatively use separate HEC tokens to correctly route your data                                                                               |
| `SPLUNK_METRICS_INDEX`            | `string`  | Splunk index to send metrics to. You can alternatively use separate HEC tokens to correctly route your data                                                                              |
| `SPLUNK_INTERNAL_INDEX`           | `string`  | Splunk index to send internal metrics to. You can alternatively use separate HEC tokens to correctly route your data                                                                     |
| `SPLUNK_EVENTS_HEC_TOKEN`         | `string`  | HEC token to use for sending events. You can alternatively configure different indexes to correctly route your data                                                                      |
| `SPLUNK_METRICS_HEC_TOKEN`        | `string`  | HEC token to use for sending metrics. You can alternatively configure different indexes to correctly route your data                                                                     |
| `SPLUNK_INTERNAL_HEC_TOKEN`       | `string`  | HEC token to use for sending internal metrics. You can alternatively configure different indexes to correctly route your data                                                            |
| `ETH_RPC_URL`                     | `string`  | URL to reach the target ethereum node. Supported format is currently only HTTP(s) for JSON RPC                                                                                           |
| `ETH_REJECT_INVALID_CERTS`        | `boolean` | Disable to allow ethereum client to connect to HTTPS without rejecting invalid (self-signed) certificates                                                                                |
| `ABI_DIR`                         | `string`  | Directory containing ABI definitions (JSON files). This directory will be searched recursively                                                                                           |
| `START_AT_BLOCK`                  | `string`  | First block to start ingesting from. Possible values are "genesis", "latest", an absolute block number or a negative number describing how many blocks before the latest one to start at |
| `REJECT_INVALID_CERTS`            | `boolean` | Disable to allow all HTTP clients (HEC and ETH) to connect to HTTPS without rejecting invalid (self-signed) certificates                                                                 |
| `NETWORK_NAME`                    | `string`  | The network name will be attached to all events sent to Splunk. This is typically either "mainnet" or "testnet".                                                                         |
| `CHAIN_NAME`                      | `string`  | The name of the chain that will be attached to all events sent to Splunk                                                                                                                 |

<!-- ENVREF-END -->
