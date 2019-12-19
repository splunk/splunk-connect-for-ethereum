# Custom image example

This example demonstrates creating a custom image based on ethlogger's base image and provide custom configuration and ABI definitions (see [Dockerfile](./Dockerfile)) on how this is achieved.

The docker-compose setup contains a Splunk Enterprise container and an ethlogger container using the custom image, sending data to the Splunk container.

## Run

```sh-session
$ docker-compose up
```

Then go to [http://localhost:8000](http://localhost:8000) to see data produced by ethlogger.
