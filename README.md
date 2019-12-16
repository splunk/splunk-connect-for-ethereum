# Splunk Connect for Ethereum

[![](https://github.com/splunk/splunk-connect-for-ethereum/workflows/CI/badge.svg)](https://github.com/splunk/splunk-connect-for-ethereum/actions?query=workflow%3ACI+branch%3Amaster)

## ethlogger

Ethlogger is a general purpose utility for logging Ethereum blocks and transactions, node information and metrics to another system for data analytics. Currently, it can log to the Splunk HTTP Event Collector and stdout. It can also deserialize transactions and events if given a contract ABI.

<!-- toc -->

### Usage

```sh-session
$ ethlogger [...options]
```

### Configuration

Find out how to configure ethlogger in the [configuration docs](./docs/configuration.md).
