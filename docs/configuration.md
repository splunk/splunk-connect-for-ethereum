# Ethlogger Configuration Files

For fine-grained control over ethlogger's operation you can

## Example

<!-- EXAMPLE -->
<!-- THIS IS GENERATED - DO NOT EDIT -->
<!-- EXAMPLE-END -->

## Reference

<!-- REFERENCE -->
<!-- THIS IS GENERATED - DO NOT EDIT -->

### Ethlogger

| Name              | Type                                                                                                                               | Description                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `eth`             | [`Ethereum`](#Ethereum)                                                                                                            | Ethereum node configuration                                                         |
| `output`          | [`HecOutput`](#HecOutput) \| [`ConsoleOutput`](#ConsoleOutput) \| [`FileOutput`](#FileOutput) \| [`DevNullOutput`](#DevNullOutput) | Output configuration                                                                |
| `hec`             | [`HecClients`](#HecClients)                                                                                                        | HTTP event collector                                                                |
| `checkpoint`      | [`Checkpoint`](#Checkpoint)                                                                                                        | Checkpoint configuration - how ethlogger keeps track of state between restarts      |
| `abi`             | [`AbiRepository`](#AbiRepository)                                                                                                  | ABI repository configuration                                                        |
| `contractInfo`    | [`ContractInfo`](#ContractInfo)                                                                                                    | Contract info cache settings                                                        |
| `blockWatcher`    | [`BlockWatcher`](#BlockWatcher)                                                                                                    | Block watcher settings, configure how blocks, transactions, event logs are ingested |
| `nodeMetrics`     | [`NodeMetrics`](#NodeMetrics)                                                                                                      | Settings for the node metrics collector                                             |
| `nodeInfo`        | [`NodeInfo`](#NodeInfo)                                                                                                            | Settings for the node info collector                                                |
| `internalMetrics` | [`InternalMetrics`](#InternalMetrics)                                                                                              | Settings for internal metrics collection                                            |

### Ethereum

General Ethereum configuration including client and transport, defining how ethlogger talks to the ethereum node

| Name      | Type                                | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`     | `string`                            | URL of JSON RPC endpoint                                                                                                                                                                                                                                                                                                                                                                                                   |
| `network` | `string`                            | Network name send as a field with every event and metric to HEC. Ethlogger will attempt to automatically determine if not specified but there are only a handful of known public networkIds associated with particular networks (ethereum mainnet, ropsten, ...). This value will allow consumers of data to distinguis between different networks in case multiple ethloggers are sending events from different networks. |
| `http`    | [`HttpTransport`](#HttpTransport)   | HTTP tansport configuration                                                                                                                                                                                                                                                                                                                                                                                                |
| `client`  | [`EthereumClient`](#EthereumClient) | Ethereum client configuration                                                                                                                                                                                                                                                                                                                                                                                              |

### HttpTransport

Settings for ethlogger connecting to the ethereum node via JSON RPC over HTTP

| Name                  | Type                 | Description                                                                                                    | Example |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- | ------- |
| `timeout`             | `string` \| `number` | Time before failing JSON RPC requests. Specify a number in milliseconds or a golang-style duration expression. | `"30s"` |
| `validateCertificate` | `boolean`            | If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs)             |         |
| `requestKeepAlive`    | `boolean`            | Keep sockets to JSON RPC open                                                                                  |         |
| `maxSockets`          | `number`             | Maximum number of sockets HEC will use (per host)                                                              |         |

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

| Name       | Type          | Description                                                                |
| ---------- | ------------- | -------------------------------------------------------------------------- |
| `default`  | [`Hec`](#Hec) | Base settings that apply to all HEC clients                                |
| `events`   | `???`         | HEC settings (overrides for `default`) for events sent to Splunk           |
| `metrics`  | `???`         | HEC settings (overrides for `default`) for metrics sent to Splunk          |
| `internal` | `???`         | HEC settings (overrides for `defualt`) for internal metrics sent to Splunk |

### Hec

Settings for the Splunk HTTP Event Collector client

| Name                          | Type                                                                                                   | Description                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`                         | `string`                                                                                               | The URL of HEC. If only the base URL is specified (path is omitted) then the default path will be used                                                                                                      |
| `token`                       | `string`                                                                                               | The HEC token used to authenticate HTTP requests                                                                                                                                                            |
| `defaultMetadata`             | `object`                                                                                               | Defaults for host, source, sourcetype and index. Can be overriden for each message                                                                                                                          |
| `defaultFields`               | `object`                                                                                               | Default set of fields to apply to all events and metrics sent with this HEC client                                                                                                                          |
| `maxQueueEntries`             | `number`                                                                                               | Maximum number of entries in the HEC message queue before flushing it                                                                                                                                       |
| `maxQueueSize`                | `number`                                                                                               | Maximum number of bytes in the HEC message queue before flushing it                                                                                                                                         |
| `flushTime`                   | `string` \| `number`                                                                                   | Maximum number of milliseconds to wait before flushing the HEC message queue                                                                                                                                |
| `gzip`                        | `boolean`                                                                                              | Gzip compress the request body sent to HEC (Content-Encoding: gzip)                                                                                                                                         |
| `maxRetries`                  | `number`                                                                                               | Maximum number of attempts to send a batch to HEC. By default this there is no limit                                                                                                                        |
| `timeout`                     | `string` \| `number`                                                                                   | Number of milliseconds to wait before considereing an HTTP request as failed                                                                                                                                |
| `requestKeepAlive`            | `boolean`                                                                                              | Keep sockets to HEC open                                                                                                                                                                                    |
| `validateCertificate`         | `boolean`                                                                                              | If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs)                                                                                                          |
| `maxSockets`                  | `number`                                                                                               | Maximum number of sockets HEC will use (per host)                                                                                                                                                           |
| `userAgent`                   | `string`                                                                                               | User-agent header sent to HEC                                                                                                                                                                               |
| `retryWaitTime`               | `string` \| `number` \| [`ExponentalBackoff`](#ExponentalBackoff) \| [`LinearBackoff`](#LinearBackoff) | Wait time before retrying to send a (batch of) HEC messages                                                                                                                                                 |
| `multipleMetricFormatEnabled` | `boolean`                                                                                              | Enable sending multipe metrics in a single message to HEC. Supported as of Splunk 8.0.0<br><br>https://docs.splunk.com/Documentation/Splunk/8.0.0/Metrics/GetMetricsInOther#The_multiple-metric_JSON_format |

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

The ABI repository is used to decode ABI information from smart contract calls and event logs. It generates and adds some additinal information in transaction and events, including smart contract method call parameter names, values and data types, as well as smart contract names associated with a particular contract address.

| Name                   | Type      | Description                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `directory`            | `string`  | If specified, the ABI repository will recursively search this directory for ABI files                                                                                                                                                                                                                                             |
| `fileExtension`        | `string`  |                                                                                                                                                                                                                                                                                                                                   |
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

### NodeMetrics

The node metrics colletor retrieves numeric measurements from nodes on a periodic basis.

| Name              | Type                                                                                                   | Description                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `enabled`         | `boolean`                                                                                              | Specify `false` to disable node metrics collection              |
| `collectInterval` | `string` \| `number`                                                                                   | Interval in which to collect node metrics                       |
| `retryWaitTime`   | `string` \| `number` \| [`ExponentalBackoff`](#ExponentalBackoff) \| [`LinearBackoff`](#LinearBackoff) | Wait time before retrying to collect node metrics after failure |

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

### NodeInfo

Platfrom specific node information is collection on regular interval

| Name              | Type                                                                                                   | Description                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `enabled`         | `boolean`                                                                                              | Specify `false` to disable node info collection              |
| `collectInterval` | `string` \| `number`                                                                                   | Interval in which to collect node info                       |
| `retryWaitTime`   | `string` \| `number` \| [`ExponentalBackoff`](#ExponentalBackoff) \| [`LinearBackoff`](#LinearBackoff) | Wait time before retrying to collect node info after failure |

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

### InternalMetrics

Ethlogger-internal metrics allow for visibilty into the operation of ethlogger itself, detect and troubleshoot bottlenecks and improve configuration.

| Name              | Type                 | Description                                            |
| ----------------- | -------------------- | ------------------------------------------------------ |
| `enabled`         | `boolean`            | Specify `false` to disable internal metrics collection |
| `collectInterval` | `string` \| `number` | Interval in which to collect internal metrics          |

<!-- REFERENCE-END -->

## notes

blah
