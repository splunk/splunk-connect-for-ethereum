# Basic example

This is a simple example showing how to run ethlogger in docker-compose alongside a Splunk Enterprise container.

Ethlogger configuration is provided in the form of environment variables in [docker-compose.yaml](./docker-compose.yaml#L25).

## Run

1. [Set up docker to pull images from Github package registry](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-docker-for-use-with-github-packages)

2. Start docker-compose

```sh-session
$ cd examples/docker-compose-basic
$ docker-compose up -d
```

3. Then go to [http://localhost:8000](http://localhost:8000) to explore the data produced by ethlogger.
   Login using user `admin` and password `changeme`

## Note

> This example is not meant to be used in a production setup. Neither Splunk nor ethlogger are setup to persist data or state.
