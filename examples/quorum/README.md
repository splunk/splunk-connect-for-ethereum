# Quorum Example

To generate an example showcasing Splunk Connect for Ethereum with **Quorum** we suggest you use [quorum-wizard](https://github.com/jpmorganchase/quorum-wizard) to generate the docker-compose configuration and supporting resources.

## Run

```sh-session
npx quorum-wizard
```

For the quickest path to a working environment with Quorum, Splunk & ethlogger, select the following:

-   Simple Network
-   docker-compose
-   istanbul
-   any version of Quorum
-   any version of Tessera
-   select Splunk

Further instructions will be printed out after the wizard creates your environment. The url and credentials for Splunk will be printed also. Navigate to the directory you chose and run `./start.sh`.

## Note

-   Run `./stop.sh` to shut down the environment.
-   The network created by quorum-wizard may not start correctly if run with Docker Compose V2. If you encounter a similar error, try disabling V2 in Docker preferences.
