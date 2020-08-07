# Besu example running ethlogger using docker-compose

This is a simple example showing how to run a Besu node in development mode being monitored by ethlogger in docker-compose alongside a Splunk Enterprise container.

Ethlogger configuration is provided in the form of [environment variables](../../docs/cli.md#environment-variables) in [docker-compose.yaml](./docker-compose.yaml#L25).

## Run

1. Start docker-compose

```sh-session
$ cd examples/besu
$ docker-compose up -d
```

2. Wait for all containers to start.
   You can rely on the output of `docker ps` to see the state of services.

3. Go to [http://localhost:8000](http://localhost:8000) and login using user `admin` and password `changeme`.

4. [Open the Ethereum Basis application](http://localhost:8000/en-US/app/ethereum-basics/introduction) to explore block data.

5. You can search for logs [with the search `index="logs"`](http://localhost:8000/en-US/app/search/search?q=search%20index%3D%22logs%22).

## Note

> This example is not meant to be used in a production setup.
> Splunk and ethlogger persist data using local volumes. If you would like to start clean run the following.
> Using the logging driver to log to a container in the same docker-compose stack shouldn't be used in production.

```sh-session
$ docker-compose down
$ docker volume prune
```
