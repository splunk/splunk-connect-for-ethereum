import { HttpTransport } from '../../src/eth/http';
import { BatchedEthereumClient } from '../../src/eth/client';
import { introspectTargetNodePlatform } from '../../src/introspect';
import { withRecorder } from '../../src/eth/recorder';
import { join } from 'path';
import { suppressDebugLogging } from '../../src/utils/debug';

let logHandle: any;
beforeEach(() => {
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore();
});

test('dai.poa.network', async () => {
    await withRecorder(
        new HttpTransport('https://dai.poa.network', {}),
        {
            name: 'xdai-introspect',
            storageDir: join(__dirname, '../fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client);

            expect(platformAdapter.name).toMatchInlineSnapshot(`"parity"`);
            expect(platformAdapter.chainId).toEqual(100);
            expect(platformAdapter.chainName).toMatchInlineSnapshot(`"xdai"`);
            expect(platformAdapter.networkName).toMatchInlineSnapshot(`"mainnet"`);

            await expect(platformAdapter.captureNodeInfo(client)).resolves.toMatchInlineSnapshot(`
                        Object {
                          "chain": "xdai",
                          "chainId": 100,
                          "clientVersion": "Parity-Ethereum//v2.5.13-stable-253ff3f-20191231/x86_64-linux-gnu/rustc1.40.0",
                          "enode": "enode://ab7f6c633ba2dc54795dfd2c739ba7d964f499541c0b8d8ba9d275bd3df1b789470a21a921a469fa515a3dfccc96a434a3fd016a169d88d0043fc6744f34288e@104.248.254.129:30303",
                          "mode": "active",
                          "network": "mainnet",
                          "networkId": 100,
                          "nodeKind": Object {
                            "availability": "personal",
                            "capability": "full",
                          },
                          "platform": "parity",
                          "protocolVersion": 63,
                          "transport": "jsonprc+https://dai.poa.network",
                        }
                    `);

            await expect(platformAdapter.captureNodeMetrics(client, 123123123)).resolves.toMatchInlineSnapshot(`
                        Object {
                          "metrics": Object {
                            "blockNumber": 8297245,
                            "gasPrice": 240000000000,
                            "hashRate": 0,
                            "peerCount": 27,
                          },
                          "time": 123123123,
                          "type": "nodeMetrics",
                        }
                    `);
        }
    );
}, 15000);

test('mainnet.infura.io', async () => {
    await withRecorder(
        new HttpTransport(`https://mainnet.infura.io/v3/${process.env.INFURA_TOKEN}`, {}),
        {
            name: 'infura-introspect',
            storageDir: join(__dirname, '../fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client);
            expect(platformAdapter.name).toMatchInlineSnapshot(`"generic:Geth"`);
            await expect(platformAdapter.captureNodeInfo(client)).resolves.toMatchInlineSnapshot(`
                        Object {
                          "chain": "eth",
                          "chainId": 1,
                          "clientVersion": "Geth/v1.9.9-omnibus-e320ae4c-20191206/linux-amd64/go1.13.4",
                          "enode": null,
                          "network": "mainnet",
                          "networkId": 1,
                          "platform": "generic:Geth",
                          "protocolVersion": 64,
                          "transport": "jsonprc+https://mainnet.infura.io",
                        }
                    `);
            await expect(platformAdapter.captureNodeMetrics(client, 123123123)).resolves.toMatchInlineSnapshot(`
                        Object {
                          "metrics": Object {
                            "blockNumber": 9447143,
                            "gasPrice": 5000000000,
                            "hashRate": 0,
                            "peerCount": 100,
                          },
                          "time": 123123123,
                          "type": "nodeMetrics",
                        }
                    `);
        }
    );
}, 15000);

test('eth-mainnet.alchemyapi.io', async () => {
    await withRecorder(
        new HttpTransport(`https://eth-mainnet.alchemyapi.io/jsonrpc/${process.env.ALCHEMY_TOKEN}`, {}),
        {
            name: 'alchemy-introspect',
            storageDir: join(__dirname, '../fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client);
            expect(platformAdapter.name).toMatchInlineSnapshot(`"generic:Parity-Ethereum"`);
            await expect(platformAdapter.captureNodeInfo(client)).resolves.toMatchInlineSnapshot(`
                        Object {
                          "chain": "eth",
                          "chainId": 1,
                          "clientVersion": "Parity-Ethereum//v2.7.2-stable-2662d19-20200206/x86_64-unknown-linux-gnu/rustc1.41.0",
                          "enode": null,
                          "network": "mainnet",
                          "networkId": 1,
                          "platform": "generic:Parity-Ethereum",
                          "protocolVersion": 63,
                          "transport": "jsonprc+https://eth-mainnet.alchemyapi.io",
                        }
                    `);
            await expect(platformAdapter.captureNodeMetrics(client, 123123123)).resolves.toMatchInlineSnapshot(`
                        Object {
                          "metrics": Object {
                            "blockNumber": 9447175,
                            "gasPrice": 6000000000,
                            "hashRate": undefined,
                            "peerCount": undefined,
                          },
                          "time": 123123123,
                          "type": "nodeMetrics",
                        }
                    `);
        }
    );
}, 15000);

test('local quorum', async () => {
    await withRecorder(
        new HttpTransport('http://localhost:22000', {}),
        {
            name: 'quorum-introspect',
            storageDir: join(__dirname, '../fixtures/recorded'),
            replay: true,
        },
        async transport => {
            const client = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
            const platformAdapter = await introspectTargetNodePlatform(client);
            expect(platformAdapter.name).toMatchInlineSnapshot(`"quorum:raft"`);
            await expect(platformAdapter.captureNodeInfo(client)).resolves.toMatchSnapshot();
            await expect(platformAdapter.captureNodeMetrics(client, 123123123)).resolves.toMatchSnapshot();
        }
    );
}, 15000);
