#!/bin/bash

export KUBECONFIG=$(dirname "$0")/.kubeconfig
minikube start --driver=docker

helm install splunk splunk-kube -f splunk-kube/splunk.yaml
helm install geth geth
helm install -f local.yaml ethlogger ../ethlogger
