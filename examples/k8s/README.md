# Kubernetes Deployments

The resources in this directory can be used to deploy ethlogger to K8s. They
are generated from our [Helm](https://github.com/kubernetes/helm) chart, which
is available in a Splunk Connect for Ethereum Helm repository -- see [Splunk Connect for Ethereum Ethlogger Helm Chart
Use](examples/helm) for more information.

You will need to edit and enter information in the `deployment.yaml` file to set environment variables values. Refer to (the documentation)[docs/cli].

At a very minimum, please make sure to enter and review carefully the environment variables `SPLUNK_HEC_TOKEN`, `SPLUNK_HEC_URL`,`ETH_RPC_URL`.

If you have contract code available, please update the ABIs available in `configmap.yml`.

To deploy run the following from the present directory:

`cat *.yaml | kubectl apply -f -`

## Development

These resources can be refreshed from the Helm chart by using the
`generate-from-helm` script in this directory.

The resources are regenerated during the release process automatically with the new version.
