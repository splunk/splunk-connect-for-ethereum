import { createNodeAdapter } from '../src/introspect';
import { EthereumClient } from '../src/eth/client';

// import { HttpTransport } from '../src/eth/http';
// import { clientVersion, gethNodeInfo, gethMemStats, gethMetrics } from '../src/eth/requests';

// test('determineNodeType', async () => {
//     const ethClient = new EthereumClient(
//         new HttpTransport({
//             url: 'http://localhost:22000',
//         })
//     );

//     console.log(await ethClient.request(clientVersion()));
//     console.log(await ethClient.request(gethNodeInfo()));
//     console.log(await ethClient.request(gethMetrics(false)));
//     console.log(await ethClient.request(gethMemStats()));
// });

test('createNodeAdapter', () => {
    const mockEthClient = {} as EthereumClient;

    expect(
        createNodeAdapter(
            mockEthClient,
            'Geth/node1-istanbul/v1.8.18-stable-2d22fd00(quorum-v2.2.3)/linux-amd64/go1.11.6'
        ).name
    ).toBe('Quorum');
});
