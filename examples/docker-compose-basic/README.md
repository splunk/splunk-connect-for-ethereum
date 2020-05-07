# Basic example running ethlogger using docker-compose

This is a simple example showing how to run ethlogger in docker-compose alongside a Splunk Enterprise container.

Ethlogger configuration is provided in the form of [environment variables](../../docs/cli.md#environment-variables) in [docker-compose.yaml](./docker-compose.yaml#L25).

## Run

1. Start docker-compose

```sh-session
$ cd examples/docker-compose-basic
$ docker-compose up -d
```

2. Wait for all containers to start.
   You can rely on the output of `docker ps` to see the state of services.

3. Then go to [http://localhost:8000](http://localhost:8000) to explore the data produced by ethlogger.
   Login using user `admin` and password `changeme`

## Note

> This example is not meant to be used in a production setup.
> Splunk and ethlogger persist data using local volumes. If you would like to start clean run the following.

```sh-session
$ docker-compose down
$ docker volume prune
```
