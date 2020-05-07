# Splunk Connect for Ethereum

[![](https://github.com/splunk/splunk-connect-for-ethereum/workflows/CI/badge.svg)](https://github.com/splunk/splunk-connect-for-ethereum/actions?query=workflow%3ACI+branch%3Amaster)

Splunk Connect for Ethereum (aka `ethlogger`) makes it easy to ingest data about Ethereum ledgers, node information, and node metrics into another system for analysis. Currently, it can log to the Splunk HTTP Event Collector and stdout. It can also [deserialize transactions and events if given a contract ABI](./docs/abi.md). Some benefits include:

-   Support for any Ethereum 1.0 JSON-RPC compatible blockchain or sidechain, including Quorum 🦄.
-   Reliably saves state between restarts so you never have missing or duplicated events 🧘‍.
-   Highly performant batching and compression algorithm 🚄.
-   Extracts a rich set of node information and metrics in order to gain deep insight into your node 🙉.
-   Introspects your node platform (i.e. geth, parity, besu or quorum) in order to ensure maximum data extraction 🎂.
-   [Contract fingerprinting](./docs/abi.md#contract-fingerprinting) in order to match ABIs with function signatures (i.e. we can decode the parameter names too!) 🔎.
-   Enables awesome dashboards (keepin' it 200) 💯💯.

If you want to learn more about [Splunk's](https://www.splunk.com) efforts to make blockchains stable, secure, and scalable raise an issue here or email us at [blockchain@splunk.com](mailto:blockchain@splunk.com).

<!-- toc -->

## Usage

```sh-session
$ ethlogger [...options]
```

Details about ethlogger's command-line usage in the [CLI docs](./docs/cli.md)

## Configuration

Find out how to configure ethlogger in the [configuration docs](./docs/configuration.md).

## Docker

Splunk Connect for Ethereum can also be run as a docker image. You can pull the image from [Docker Hub](https://hub.docker.com/r/splunkdlt/ethlogger) or the [Github package registry](https://github.com/splunk/splunk-connect-for-ethereum/packages/90723?version=latest) (Make sure to [set up docker to pull images from Github package registry](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-docker-for-use-with-github-packages)).

Example:

```sh-session
$ docker run -it splunkdlt/ethlogger:latest \
    --eth-rpc-url=https://dai.poa.network \
    --start-at-block=latest \
    --hec-url=https://mysplunkserver.com:8088 \
    --hec-token=123-123-123-123 \
    --hec-events-index=main \
    --hec-metrics-index=metrics
```

There is also an example on how to run [ethlogger in docker-compose](./examples/docker-compose-basic).

## Troubleshooting

There's a lot of information available via RPC on Ethereum nodes, but they need to be enabled via the command line on startup for `ethlogger` to connect. See the relevant docs for:

-   [Geth and Quorum Docs](https://github.com/ethereum/go-ethereum/wiki/Management-APIs) or you can turn it all on: `--rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3`
-   Quorum Specific Endpoints: `--rpcapi quorum,istanbul,raft` (note: only one of `istanbul` or `raft` is active depending on the consensus method)
-   Geth and Quorum: ensure that the host `ethlogger` is running on is whitelisted in the `--rpcvhosts` cli setting.
-   [Parity Endpoints](https://wiki.parity.io/JSONRPC): note that the command line flag is `--jsonrpc-apis APIs`
-   [Besu Endpoints](https://besu.hyperledger.org/en/stable/HowTo/Interact/APIs/Using-JSON-RPC-API/) or you can turn on: `--rpc-http-enabled --rpc-ws-enabled --rpc-http-api admin,eth,debug,miner,net,txpool,priv,trace,web3`

## Contributing

Thank you for considering to contribute to Splunk Connect for Ethereum! Please read the [contribution guidelines](./CONTRIBUTING.md) to get started.
