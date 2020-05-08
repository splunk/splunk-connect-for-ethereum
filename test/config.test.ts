import { debug } from 'debug';
import { loadEthloggerConfig, CliFlags } from '../src/config';

beforeAll(() => {
    debug.log = () => {
        // ignore
    };
});

test('defaults', async () => {
    await expect(loadEthloggerConfig({} as CliFlags, true)).resolves.toMatchInlineSnapshot(`
                Object {
                  "abi": Object {
                    "abiFileExtension": ".json",
                    "decodeAnonymous": true,
                    "directory": undefined,
                    "fingerprintContracts": true,
                  },
                  "blockWatcher": Object {
                    "blocksMaxChunkSize": 25,
                    "enabled": true,
                    "maxParallelChunks": 3,
                    "pollInterval": 500,
                    "retryWaitTime": [Function],
                    "startAt": "genesis",
                  },
                  "checkpoint": Object {
                    "filename": "checkpoints.json",
                    "saveInterval": 250,
                  },
                  "contractInfo": Object {
                    "maxCacheEntries": 25000,
                  },
                  "eth": Object {
                    "chain": undefined,
                    "client": Object {
                      "maxBatchSize": 100,
                      "maxBatchTime": 0,
                    },
                    "http": Object {
                      "maxSockets": 256,
                      "requestKeepAlive": true,
                      "timeout": 60000,
                      "validateCertificate": true,
                    },
                    "network": undefined,
                    "url": undefined,
                  },
                  "hec": Object {
                    "default": Object {
                      "defaultFields": Object {
                        "chain": "$CHAIN",
                        "chainId": "$CHAIN_ID",
                        "enode": "$ENODE",
                        "network": "$NETWORK",
                        "networkId": "$NETWORK_ID",
                        "platform": "$PLATFORM",
                      },
                      "defaultMetadata": Object {
                        "host": "$ETH_NODE_HOSTNAME",
                        "source": "ethlogger",
                      },
                      "flushTime": 0,
                      "gzip": true,
                      "maxQueueEntries": -1,
                      "maxQueueSize": 512000,
                      "maxRetries": Infinity,
                      "maxSockets": 128,
                      "multipleMetricFormatEnabled": false,
                      "requestKeepAlive": true,
                      "retryWaitTime": [Function],
                      "timeout": 30000,
                      "token": undefined,
                      "url": undefined,
                      "userAgent": "ethlogger-hec-client/$VERSION",
                      "validateCertificate": true,
                      "waitForAvailability": 120000,
                    },
                    "events": undefined,
                    "internal": Object {
                      "defaultFields": Object {
                        "nodeVersion": "$NODE_VERSION",
                        "pid": "$PID",
                        "version": "$VERSION",
                      },
                      "defaultMetadata": Object {
                        "host": "$HOSTNAME",
                        "source": "ethlogger:internal",
                        "sourcetype": "ethlogger:internal",
                      },
                      "flushTime": 5000,
                    },
                    "metrics": undefined,
                  },
                  "internalMetrics": Object {
                    "collectInterval": 1000,
                    "enabled": false,
                  },
                  "nodeInfo": Object {
                    "collectInterval": 60000,
                    "enabled": true,
                    "retryWaitTime": [Function],
                  },
                  "nodeMetrics": Object {
                    "collectInterval": 1000,
                    "enabled": true,
                    "retryWaitTime": [Function],
                  },
                  "output": Object {
                    "metricsPrefix": "eth",
                    "sourcetypes": Object {
                      "block": "ethereum:block",
                      "event": "ethereum:transaction:event",
                      "gethPeer": "ethereum:geth:peer",
                      "nodeInfo": "ethereum:node:info",
                      "nodeMetrics": "ethereum:node:metrics",
                      "pendingtx": "ethereum:transaction:pending",
                      "transaction": "ethereum:transaction",
                    },
                    "type": "hec",
                  },
                  "peerInfo": Object {
                    "collectInterval": 10000,
                    "enabled": false,
                    "retryWaitTime": 10000,
                  },
                  "pendingTx": Object {
                    "collectInterval": 10000,
                    "enabled": false,
                    "retryWaitTime": 10000,
                  },
                }
            `);
});

test('cli flags overrides', async () => {
    const config = await loadEthloggerConfig({ 'start-at-block': '-1000' } as any, true);
    expect(config.blockWatcher).toMatchInlineSnapshot(`
        Object {
          "blocksMaxChunkSize": 25,
          "enabled": true,
          "maxParallelChunks": 3,
          "pollInterval": 500,
          "retryWaitTime": [Function],
          "startAt": -1000,
        }
    `);
});
