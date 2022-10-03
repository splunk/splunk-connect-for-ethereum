# Basic example running ethlogger using docker-compose

This is a simple example showing how to run ethlogger in docker-compose alongside a Splunk Enterprise container.

Ethlogger configuration is provided in the form of [environment variables](../../docs/cli.md#environment-variables) in [docker-compose.yaml](./docker-compose.yaml#L25).

## Run

1. Start docker-compose

```sh-session
$ cd examples/docker-compose-basic
$ docker-compose up -d
```

2. Wait for all containers to start (typically just a few minutes).
   You can rely on the output of `docker ps` to see the state of services. To see the logs use `docker logs ethlogger` and `docker logs splunk`.

3. Login to Splunk and check out the [Splunk App for Ethereum](http://localhost:8000/app/splunk-app-for-ethereum/ethereum_starter_searches) to explore the data ingested by ethlogger. Login using user `admin` and password `changeme` and start exploring! The Splunk App for Ethereum has a number of dashboards to help get you started quickly.  
   Note: if you change the index name please update the `ethereum_index` macro so the dashboards will populate.

4. Create a new index named `metrics` that is a `metric` type of index. This will be used to gather monitoring metrics for ethlogger itself.
   You can create the index by choosing Settings and then Indexes from the menu in Splunk. Once created, check out the [Node Health - SC4Ethereum](http://localhost:8000/app/splunk-app-for-ethereum/node_health__sc4ethereum) dashboard under the `Node Monitoring` menu.

## Note

> This example is not meant to be used in a production setup.
> Using the logging driver to log to a container in the same docker-compose stack shouldn't be used in production.
> Splunk and ethlogger persist data using local volumes and a checkpoints file. If blocks are no longer being ingested, or if you want to change the blockchain you are using, you should clear this state. To start clean, run the following.

```sh-session
$ docker-compose down
$ rm checkpoints.json
$ docker volume prune
```
