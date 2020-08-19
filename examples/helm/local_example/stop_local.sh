#!/bin/bash

export KUBECONFIG=$(dirname "$0")/.kubeconfig
minikube delete

rm $KUBECONFIG
