# Watching NFT transfers

This is an example showing how to use ethlogger to track the activity of NFTs.

Ethlogger configuration is provided in the form of [environment variables](../../docs/cli.md#environment-variables) in [docker-compose.yaml](./docker-compose.yaml#L25) and a configuration file, [ethlogger.yaml](./ethlogger.yaml).

This example runs against the public xDai RPC endpoint to capture all POAP token activity.

## Run

1. Edit ethlogger.yaml to enter a recent block number.
   The public endpoint is not an archive node. Consider running an archive node if you want to capture activity beyond the last 256 blocks.

2. Start docker-compose

```sh-session
$ cd examples/nft-tracking
$ docker-compose up -d
```

3. Wait for all containers to start.
   You can rely on the output of `docker ps` to see the state of services.

4. Then go to [http://localhost:8000](http://localhost:8000) to explore the data produced by ethlogger.
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
