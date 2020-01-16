# Splunk Connect for Quorum

This example starts up a 2 node Quorum node with transaction managers to demonstrate how Splunk Connect for Ethereum is compatible with Quorum. To start the demo run the command:

```
./start (istanbul|raft)
```

You can view Splunk at `localhost:18000`

To shut down the example:

```
docker-compose down
pkill -f txns.sh
```

The second command shuts down the script that submits transactions every 30 seconds.
