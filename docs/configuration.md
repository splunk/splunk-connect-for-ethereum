# Ethlogger Configuration Files

For fine-grained control over ethlogger's operation you can create a configuration file and tweak any of the settings available. Some settings can also be adjusted using [CLI flags](./cli.md#cli-flags-reference) or [environment variables](./cli.md#environment-variables) (CLI flags and environment variables do take precedence over settings in the configuration, if specified).

The configuration file can be created either in `YAML` or in `JSON` format. You can specify the configuration file path using the `--config-file` (short `-c`) CLI flag:

```sh-session
$ ethlogger -c path/to/myconfig.yaml
```

or, if omitted, ethlogger will look for a file called `ethlogger.yaml` in the current working directory. If this file is not present either, then ethlogger will go with the default configuration.

The configuration file content will be layered on top of the defaults, so it is only necessary to specify settings where the default needs to be overridden.

## Example

`ethlogger.yaml`

<!-- EXAMPLE -->

```yaml
eth:
    url: https://dai.poa.network
    network: xdai
hec:
    default:
        url: https://localhost:8088
        token: 44422111-0000-3232-9821-26664c2e7515
        validateCertificate: false
        # Splunk 8.0 or higher support compact metrics HEC messages
        multipleMetricFormatEnabled: true
    events:
        defaultMetadata:
            index: myevents
    metrics:
        defaultMetadata:
            index: mymetrics
blockWatcher:
    startAt: latest
abi:
    directory: ./abis
internalMetrics:
    enabled: false
```

<!-- EXAMPLE-END -->

## Debugging ethlogger configuration

Ethlogger has a dedicated flag `--print-config` to show the effective configuration after merging defaults, config file, environment variables and CLI flags.

```sh-session
$ ethlogger -c myconfig.yaml --print-config
```

## Reference

<!-- REFERENCE -->

### Ethlogger

Root configuration schema for ethlogger

| Name              | Type                                                                                                                               | Description                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eth`             | [`Ethereum`](#Ethereum)                                                                                                            | Ethereum node configuration                                                                                                                                                                                            |
| `output`          | [`HecOutput`](#HecOutput) \| [`ConsoleOutput`](#ConsoleOutput) \| [`FileOutput`](#FileOutput) \| [`DevNullOutput`](#DevNullOutput) | In the output configuration you can specify where ethlogger will send generated metrics and events to. By default it will send all information to Splunk HEC, but you can instead send it to console output or a file. |
| `hec`             | [`HecClients`](#HecClients)                                                                                                        | HTTP event collector                                                                                                                                                                                                   |
| `checkpoint`      | [`Checkpoint`](#Checkpoint)                                                                                                        | Checkpoint configuration - how ethlogger keeps track of state between restarts                                                                                                                                         |
| `abi`             | [`AbiRepository`](#AbiRepository)                                                                                                  | ABI repository configuration                                                                                                                                                                                           |
| `contractInfo`    | [`ContractInfo`](#ContractInfo)                                                                                                    | Contract info cache settings                                                                                                                                                                                           |
| `blockWatcher`    | [`BlockWatcher`](#BlockWatcher)                                                                                                    | Block watcher settings, configure how blocks, transactions, event logs are ingested                                                                                                                                    |
| `nodeMetrics`     | [`NodeMetrics`](#NodeMetrics)                                                                                                      | Settings for the node metrics collector                                                                                                                                                                                |
| `nodeInfo`        | [`NodeInfo`](#NodeInfo)                                                                                                            | Settings for the node info collector                                                                                                                                                                                   |
| `internalMetrics` | [`InternalMetrics`](#InternalMetrics)                                                                                              | Settings for internal metrics collection                                                                                                                                                                               |

### Ethereum

General Ethereum configuration including client and transport, defining how ethlogger talks to the ethereum node

| Name      | Type                                | Description                                                                                                                                                                                                                                                                                                                                                                                             |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`     | `string`                            | URL of JSON RPC endpoint                                                                                                                                                                                                                                                                                                                                                                                |
| `network` | `string`                            | Network name logged as a field with every event and metric. Ethlogger will attempt to automatically determine if not specified but there are only a handful of known public networkIds associated with particular networks (ethereum mainnet, ropsten, ...). This value will allow consumers of data to distinguish between different networks in case multiple networks are being logged to one place. |
| `http`    | [`HttpTransport`](#HttpTransport)   | HTTP tansport configuration                                                                                                                                                                                                                                                                                                                                                                             |
| `client`  | [`EthereumClient`](#EthereumClient) | Ethereum client configuration                                                                                                                                                                                                                                                                                                                                                                           |

### HttpTransport

Settings for ethlogger connecting to the ethereum node via JSON RPC over HTTP

| Name                  | Type                 | Description                                                                                                                            |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `timeout`             | `string` \| `number` | Time before failing JSON RPC requests. Specify a number in milliseconds or a golang-style duration expression.<br><br>Example: `"30s"` |
| `validateCertificate` | `boolean`            | If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs)                                     |
| `requestKeepAlive`    | `boolean`            | Keep sockets to JSON RPC open                                                                                                          |
| `maxSockets`          | `number`             | Maximum number of sockets HEC will use (per host)                                                                                      |

### EthereumClient

Etherem client settings - configure batching multiple JSON RPC method calls into single HTTP requests

| Name           | Type                 | Description                                                                                      |
| -------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `maxBatchSize` | `number`             | Maximum number of JSON RPC requests to pack into a single batch. Set to `1` to disable batching. |
| `maxBatchTime` | `string` \| `number` | Maximum time to wait before submitting a batch of JSON RPC requests                              |

### HecOutput

| Name            | Type                          | Description                                                        |
| --------------- | ----------------------------- | ------------------------------------------------------------------ |
| `type`          | `"hec"`                       |                                                                    |
| `sourcetypes`   | [`Sourcetypes`](#Sourcetypes) | Sourcetypes to use for different kinds of events we send to Splunk |
| `metricsPrefix` | `string`                      | A common prefix for all metrics emitted to Splunk                  |

### Sourcetypes

| Name             | Type     | Default                          |
| ---------------- | -------- | -------------------------------- |
| `block`          | `string` | `"ethereum:block"`               |
| `transaction`    | `string` | `"ethereum:transaction"`         |
| `event`          | `string` | `"ethereum:transaction:event"`   |
| `pendingtx`      | `string` | `"ethereum:transaction:pending"` |
| `nodeInfo`       | `string` | `"ethereum:node:info"`           |
| `nodeMetrics`    | `string` | `"ethereum:node:metrics"`        |
| `quorumProtocol` | `string` | `"ethereum:quorum:protocol"`     |
| `gethPeer`       | `string` | `"ethereum:geth:peer"`           |

### ConsoleOutput

Console output prints all generated events and metrics to STDOUT

| Name   | Type        |
| ------ | ----------- |
| `type` | `"console"` |

### FileOutput

File output will append all generated messages to a file. (this output type has not been implemented)

| Name   | Type     | Description         |
| ------ | -------- | ------------------- |
| `type` | `"file"` |                     |
| `path` | `string` | Path to otuput file |

### DevNullOutput

Null output will just drop all generated events and metrics

| Name   | Type     |
| ------ | -------- |
| `type` | `"null"` |

### HecClients

| Name       | Type          | Description                                                                                                                                                                                                |
| ---------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`  | [`Hec`](#Hec) | Base settings that apply to all HEC clients. Overrides for events, metrics and internal metrics will be layered on top of the defaults and allow for using different HEC tokens, URL or destination index. |
| `events`   | [`Hec`](#Hec) | HEC settings (overrides for `default`) for events sent to Splunk                                                                                                                                           |
| `metrics`  | [`Hec`](#Hec) | HEC settings (overrides for `default`) for metrics sent to Splunk                                                                                                                                          |
| `internal` | [`Hec`](#Hec) | HEC settings (overrides for `default`) for internal metrics sent to Splunk                                                                                                                                 |

### Hec

Settings for the Splunk HTTP Event Collector client

| Name                          | Type                                                                                                   | Description                                                                                                                                                                                                 | Default                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `url`                         | `string`                                                                                               | The URL of HEC. If only the base URL is specified (path is omitted) then the default path will be used                                                                                                      |                                  |
| `token`                       | `string`                                                                                               | The HEC token used to authenticate HTTP requests                                                                                                                                                            |                                  |
| `defaultMetadata`             | `object`                                                                                               | Defaults for host, source, sourcetype and index. Can be overriden for each message                                                                                                                          |                                  |
| `defaultFields`               | `object`                                                                                               | Default set of fields to apply to all events and metrics sent with this HEC client                                                                                                                          |                                  |
| `maxQueueEntries`             | `number`                                                                                               | Maximum number of entries in the HEC message queue before flushing it                                                                                                                                       |                                  |
| `maxQueueSize`                | `number`                                                                                               | Maximum number of bytes in the HEC message queue before flushing it                                                                                                                                         |                                  |
| `flushTime`                   | `string` \| `number`                                                                                   | Maximum number of milliseconds to wait before flushing the HEC message queue                                                                                                                                |                                  |
| `gzip`                        | `boolean`                                                                                              | Gzip compress the request body sent to HEC (Content-Encoding: gzip)                                                                                                                                         |                                  |
| `maxRetries`                  | `number`                                                                                               | Maximum number of attempts to send a batch to HEC. By default this there is no limit                                                                                                                        |                                  |
| `timeout`                     | `string` \| `number`                                                                                   | Number of milliseconds to wait before considereing an HTTP request as failed                                                                                                                                |                                  |
| `requestKeepAlive`            | `boolean`                                                                                              | Set to `false` to disable HTTP keep-alive for connections to Splunk                                                                                                                                         |                                  |
| `validateCertificate`         | `boolean`                                                                                              | If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs)                                                                                                          |                                  |
| `maxSockets`                  | `number`                                                                                               | Maximum number of sockets HEC will use (per host)                                                                                                                                                           |                                  |
| `userAgent`                   | `string`                                                                                               | User-agent header sent to HEC                                                                                                                                                                               | `ethlogger-hec-client/<version>` |
| `retryWaitTime`               | `string` \| `number` \| [`ExponentalBackoff`](#ExponentalBackoff) \| [`LinearBackoff`](#LinearBackoff) | Wait time before retrying to send a (batch of) HEC messages after an error                                                                                                                                  |                                  |
| `multipleMetricFormatEnabled` | `boolean`                                                                                              | Enable sending multipe metrics in a single message to HEC. Supported as of Splunk 8.0.0<br><br>https://docs.splunk.com/Documentation/Splunk/8.0.0/Metrics/GetMetricsInOther#The_multiple-metric_JSON_format |                                  |

### ExponentalBackoff

Exponentiallly increasing wait time with randomness

| Name   | Type                    | Description       |
| ------ | ----------------------- | ----------------- |
| `type` | `"exponential-backoff"` |                   |
| `min`  | `string` \| `number`    | Minimum wait time |
| `max`  | `string` \| `number`    | Maximum wait time |

### LinearBackoff

Linear increasing wait time

| Name   | Type                 | Description                                                                 |
| ------ | -------------------- | --------------------------------------------------------------------------- |
| `type` | `"linear-backoff"`   |                                                                             |
| `min`  | `string` \| `number` | Minimum wait time (after the first failure)                                 |
| `step` | `string` \| `number` | Increase of wait time for each failure after the first until max is reached |
| `max`  | `string` \| `number` | Maximum wait time                                                           |

### Checkpoint

The checkpoint is where ethlogger keeps track of its state, which blocks have already been processed. This allows it to resume where it left off after being shut down and restarted.

| Name           | Type                 | Description                                                                                    | Default            |
| -------------- | -------------------- | ---------------------------------------------------------------------------------------------- | ------------------ |
| `filename`     | `string`             | File path (relative to the current working directory) where the checkpoint file will be stored | `checkpoints.json` |
| `saveInterval` | `string` \| `number` | Maximum duration before saving updated checkpoint information to disk                          |                    |

### AbiRepository

The ABI repository is used to decode ABI information from smart contract calls and event logs. It generates and adds some additional information in transactions and events, including smart contract method call parameter names, values and data types, as well as smart contract names associated with a particular contract address.

| Name                   | Type      | Description                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `directory`            | `string`  | If specified, the ABI repository will recursively search this directory for ABI files                                                                                                                                                                                                                                             |
| `fileExtension`        | `string`  | Currently set to `.json` as the file extension for ABIs.                                                                                                                                                                                                                                                                          |
| `fingerprintContracts` | `boolean` | If enabled, the ABI repsitory will creates hashes of all function and event signatures of an ABI (the hash is the fingerprint) and match it against the EVM bytecode obtained from live smart contracts we encounter.<br><br>NOTE: disabling it is currently being ignored since non-fingerprint matching hasn't been implemented |

### ContractInfo

Ethlogger checks for each address it encounters whether it is a smart contract by attempting to retrieve the contract code. To reduce the performance hit by this operation, ethlogger can cache contract information in memory.

| Name              | Type     | Description                                                                                |
| ----------------- | -------- | ------------------------------------------------------------------------------------------ |
| `maxCacheEntries` | `number` | Maximum number of contract info results to cache in memory. Set to 0 to disable the cache. |

### BlockWatcher

Block watcher is the component that retrieves blocks, transactions, event logs from the node and sends them to output.

| Name                 | Type                                                                                                   | Description                                                                                                                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`            | `boolean`                                                                                              | Specify `false` to disable the block watcher                                                                                                                                                                                                                                                               |
| `pollInterval`       | `string` \| `number`                                                                                   | Interval in which to look for the latest block number (if not busy processing the backlog)                                                                                                                                                                                                                 |
| `blocksMaxChunkSize` | `number`                                                                                               | Max. number of blocks to fetch at once                                                                                                                                                                                                                                                                     |
| `startAt`            | `number` \| `"latest"` \| `"genesis"`                                                                  | If no checkpoint exists (yet), this specifies which block should be chosen as the starting point. Specify a positive integer for an absolute block number or a negative integer to start at n blocks before the latest one. You can also specify "genesis" (block 0) or "latest" (currently latest block). |
| `retryWaitTime`      | `string` \| `number` \| [`ExponentalBackoff`](#ExponentalBackoff) \| [`LinearBackoff`](#LinearBackoff) | Wait time before retrying to fetch and process blocks after failure                                                                                                                                                                                                                                        |

### NodeMetrics

The node metrics colletor retrieves numeric measurements from nodes on a periodic basis.

| Name              | Type                                                                                                   | Description                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `enabled`         | `boolean`                                                                                              | Specify `false` to disable node metrics collection              |
| `collectInterval` | `string` \| `number`                                                                                   | Interval in which to collect node metrics                       |
| `retryWaitTime`   | `string` \| `number` \| [`ExponentalBackoff`](#ExponentalBackoff) \| [`LinearBackoff`](#LinearBackoff) | Wait time before retrying to collect node metrics after failure |

### NodeInfo

Platform specific node information is collection on regular interval

| Name              | Type                                                                                                   | Description                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `enabled`         | `boolean`                                                                                              | Specify `false` to disable node info collection              |
| `collectInterval` | `string` \| `number`                                                                                   | Interval in which to collect node info                       |
| `retryWaitTime`   | `string` \| `number` \| [`ExponentalBackoff`](#ExponentalBackoff) \| [`LinearBackoff`](#LinearBackoff) | Wait time before retrying to collect node info after failure |

### InternalMetrics

Ethlogger-internal metrics allow for visibility into the operation of ethlogger itself.

| Name              | Type                 | Description                                            |
| ----------------- | -------------------- | ------------------------------------------------------ |
| `enabled`         | `boolean`            | Specify `false` to disable internal metrics collection |
| `collectInterval` | `string` \| `number` | Interval in which to collect internal metrics          |

<!-- REFERENCE-END -->

## Additional Information

### Durations

> // TODO

### Wait times

> // TODO

### JSON Schema

> // TODO

#### Editor Integration

-   VS Code: https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings
