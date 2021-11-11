# Watching ERC-20 token balances

This is an example showing how to use ethlogger to track the activity of an ERC-20 token.

Ethlogger configuration is provided in the form of [environment variables](../../docs/cli.md#environment-variables) in [docker-compose.yaml](./docker-compose.yaml#L25) and a configuration file, [ethlogger.yaml](./ethlogger.yaml).

## Run

1. Start docker-compose

```sh-session
$ cd examples/erc20-tracking
$ docker-compose up -d
```

2. Wait for all containers to start.
   You can rely on the output of `docker ps` to see the state of services.

3. Then go to [http://localhost:8000](http://localhost:8000) to explore the data produced by ethlogger.
   Login using user `admin` and password `changeme`

## Note

> This example is not meant to be used in a production setup.
> Using the logging driver to log to a container in the same docker-compose stack shouldn't be used in production.
> Splunk and ethlogger persist data using local volumes and a checkpoints file. If blocks are no longer being ingested, or if you want to change the blockchain you are using, you should clear this state. To start clean, run the following.

```sh-session
$ docker-compose down
$ rm checkpoints.json
$ docker volume prune
```
