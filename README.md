# Splunk Connect for Ethereum

## :warning: Disclaimer : Post September 15, 2022 Merge Support :warning:
Splunk Connect for Ethereum has not been fully tested with changes resulting from the move from Proof-of-Work (POW) to Proof-of-Stake (POS), more commonly known as the Merge, that occurred on September 15, 2022.   There should be no impact to permissioned ethereum-based networks, but POS-based Ethereum mainnet has not been fully tested.

[![](https://github.com/splunk/splunk-connect-for-ethereum/workflows/CI/badge.svg)](https://github.com/splunk/splunk-connect-for-ethereum/actions?query=workflow%3ACI+branch%3Amain)

Splunk Connect for Ethereum (aka `ethlogger`) makes it easy to ingest data about Ethereum ledgers, node information, and node metrics into another system for analysis. Currently, it can log to the Splunk HTTP Event Collector and stdout. It can also [deserialize transactions and events if given a contract ABI](./docs/abi.md). Some benefits include:

-   Support for any Ethereum 1.0 JSON-RPC compatible blockchain or sidechain, including Quorum 🦄.
-   Reliably saves state between restarts so you never have missing or duplicated events 🧘‍.
-   Highly performant batching and compression algorithm 🚄.
-   Extracts a rich set of node information and metrics in order to gain deep insight into your node 🙉.
-   Introspects your node platform (i.e. geth, parity, besu or quorum) in order to ensure maximum data extraction 🎂.
-   [Contract fingerprinting](./docs/abi.md#contract-fingerprinting) in order to match ABIs with function signatures (i.e. we can decode the parameter names too!) 🔎.
-   Enables awesome dashboards (keepin' it 200) 💯💯. Check out the companion [Splunk App for Ethereum](https://github.com/splunk/splunk-app-for-ethereum) for some starter searches and dashboards too! [Download the latest release[(https://github.com/splunk/splunk-app-for-ethereum/releases/latest)] and install it into your own Splunk instance to visulaize the data.

If you want to learn more about [Splunk's](https://www.splunk.com) efforts to make blockchains stable, secure, and scalable raise an issue here or email us at [blockchain@splunk.com](mailto:blockchain@splunk.com).

<!-- toc -->

## Prerequisites

Prior to running Splunk Connect for Ethereum you will need to ensure your Splunk server has been configured with an HTTP Event Collector (HEC) endpoint and token and that the token specified has the ability to write data to the indexes provided in your configuration settings.

You will need 2 separate indexes; 1 for events and 1 for metrics.

## Usage

```sh-session
$ ethlogger [...options]
```

Details about ethlogger's command-line usage in the [CLI docs](./docs/cli.md)

## Configuration

Find out how to configure ethlogger in the [configuration docs](./docs/configuration.md).

## Docker

Splunk Connect for Ethereum can be run in a docker container. You can pull the image from the [GitHub container registry](https://github.com/orgs/splunkdlt/packages/container/package/ethlogger).

Example:

```sh-session
$ docker run -it ghcr.io/splunkdlt/ethlogger:latest \
    --eth-rpc-url=https://rpc.gnosischain.com\
    --start-at-block=latest \
    --hec-url=https://mysplunkserver.com:8088 \
    --hec-token=123-123-123-123 \
    --hec-events-index=main \
    --hec-metrics-index=metrics
```

There is also an example on how to run [ethlogger in docker-compose](./examples/docker-compose-basic). This example will spin up a container for Splunk, install the Splunk App for Ethereum, and start a container for Splunk Connect for Ethereum. Ethereum data will start flowing into Splunk within a few minutes starting from the latest block. To get started follow these steps:

1. Download the [docker-compose.yaml](./examples/docker-compose-basic/docker-compose.yaml) file.

```sh-session
$ curl -O https://raw.githubusercontent.com/splunk/splunk-connect-for-ethereum/main/examples/docker-compose-basic/docker-compose.yaml
```

2. Start the docker containers using docker-compose.

```sh-session
$ docker-compose up
```

3. Wait for all containers to start (typically just a few minutes).
   You can rely on the output of `docker ps` to see the state of services. To see the logs use `docker logs ethlogger` and `docker logs splunk`.

4. Login to Splunk and check out the [Splunk App for Ethereum](http://localhost:8000/app/splunk-app-for-ethereum/ethereum_starter_searches) to explore the data ingested by ethlogger. Login using user `admin` and password `changeme` and start exploring! The Splunk App for Ethereum has a number of dashboards to help get you started quickly.
   Note: if you change the index name please update the `ethereum_index` macro so the dashboards will populate.
5. Create a new index named `metrics` that is a `metric` type of index. This will be used to gather monitoring metrics for ethlogger itself.
   You can create the index by choosing Settings and then Indexes from the menu in Splunk. Once created, check out the [Node Health - SC4Ethereum](http://localhost:8000/app/splunk-app-for-ethereum/node_health__sc4ethereum) dashboard under the `Node Monitoring` menu.

6. Shut it down and clean up for next time.

```sh-session
$ docker-compose down
$ rm checkpoints.json
$ docker volume prune
```

## Troubleshooting

There's a lot of information available via RPC on Ethereum nodes, but they need to be enabled via the command line on startup for `ethlogger` to connect. See the relevant docs for:

-   [Geth and Quorum Docs](https://geth.ethereum.org/docs/rpc/server) or you can turn it all on: `--http.api admin,db,eth,debug,miner,net,shh,txpool,personal,web3`
-   Quorum Specific Endpoints: `--http.api quorum,istanbul,raft` (note: only one of `istanbul` or `raft` is active depending on the consensus method)
-   Geth and Quorum: ensure that the host `ethlogger` is running on is whitelisted in the `--http.vhosts` cli setting.
-   [OpenEthereum (Parity) Endpoints](https://openethereum.github.io/JSONRPC): note that the command line flag is `--jsonrpc-apis APIs`
-   [Besu Endpoints](https://besu.hyperledger.org/en/stable/HowTo/Interact/APIs/Using-JSON-RPC-API/) or you can turn on: `--rpc-http-enabled --rpc-http-api admin,eth,debug,miner,net,txpool,priv,trace,web3`

## Contributing

Thank you for considering to contribute to Splunk Connect for Ethereum! Please read the [contribution guidelines](./CONTRIBUTING.md) to get started.
