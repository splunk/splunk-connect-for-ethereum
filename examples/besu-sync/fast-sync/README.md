# Fast sync over Goerli network

## Run

1. Set up the .env file

Copy the .env.template file to .env and fill it with a SignalFx token and a realm as well as the version of Besu to run with.

2. Start docker-compose

```sh-session
$ docker-compose up -d
```

2. Wait for all containers to start.
   You can rely on the output of `docker ps` to see the state of services.

3. Go to [http://localhost:8000](http://localhost:8000) and login using user `admin` and password `changeme`.

4. [Open the Besu fast sync app](http://localhost:8000/en-US/app/besu-fast-sync) to see how the sync is going.

5. You can search for logs [with the search `index="logs"`](http://localhost:8000/en-US/app/search/search?q=search%20index%3D%22logs%22).

## Note

> This example is not meant to be used in a production setup.
> Splunk and ethlogger persist data using local volumes. If you would like to start clean run the following.
> Using the logging driver to log to a container in the same docker-compose stack shouldn't be used in production.

```sh-session
$ docker-compose down
$ docker volume prune
```
