# Quorum example running ethlogger using docker-compose

This example uses [`quorum-wizard`]() to generate a docker-compose configuration and supporting resources.

## Run

```sh-session
npm install -g quorum-wizard@beta
quorum-wizard
```

For the quickest path to a working environment with Quorum, Splunk & ethlogger, select the following:
 - Simple Network
 - docker-compose
 - istanbul
 - any version of Quorum
 - any version of Tessera
 - select Splunk

Further instructions will be printed out after the wizard creates your environment. The url and credentials for Splunk will be printed also. Navigate to the directory you chose and run `./start.sh`.

## Note

Run `./stop.sh` to shut down the environment.
