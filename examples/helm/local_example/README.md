# Local example

You can try out locally the ethlogger helm chart with a local example that spins up a Geth client, a Splunk instance and ethlogger.

The example requires that you have [minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) and [Docker](https://www.docker.com/) installed.

To start the example, open a terminal in this directory and type:

```shell script
$> ./start_local.sh
```

Check all services have started with:

```shell script
$> kubectl get pods
```

When everything is ready, use this command to expose Splunk to your machine:

```shell script
minikube service splunk-splunk-kube
```

This command opens a web browser with a random port number. You can log in with `admin`/`changeme`.

You can now consult the applications and see the ledger data coming from the Geth node running in development mode.

When you want to stop minikube and the pods, run:

```shell script
$> ./stop_local.sh
```
