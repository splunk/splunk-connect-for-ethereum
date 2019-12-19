# Basic example

This is a simple example showing how to run ethlogger in docker-compose alongside a Splunk Enterprise container.

Ethlogger configuration is provided in the form of environment variables in [docker-compose.yaml](./docker-compose.yaml#L20).

## Run

```sh-session
$ docker-compose up
```

Then go to [http://localhost:8000](http://localhost:8000) to see data produced by ethlogger.
