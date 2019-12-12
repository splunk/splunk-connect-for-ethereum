import { createNodeAdapter } from '../src/introspect';
import { EthereumClient } from '../src/eth/client';

test('createNodeAdapter', () => {
    const mockEthClient = {} as EthereumClient;

    expect(
        createNodeAdapter(
            mockEthClient,
            'Geth/node1-istanbul/v1.8.18-stable-2d22fd00(quorum-v2.2.3)/linux-amd64/go1.11.6'
        ).name
    ).toBe('quorum');
});
