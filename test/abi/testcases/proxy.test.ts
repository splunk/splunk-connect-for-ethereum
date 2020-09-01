import debugModule from 'debug';
import { join } from 'path';
import { ContractInfo, getContractInfo } from '../../../src/abi/contract';
import { AbiRepository } from '../../../src/abi/repo';
import { BlockWatcher } from '../../../src/blockwatcher';
import { Checkpoint } from '../../../src/checkpoint';
import { BatchedEthereumClient } from '../../../src/eth/client';
import { HttpTransport } from '../../../src/eth/http';
import { withRecorder } from '../../../src/eth/recorder';
import { enableTraceLogging, suppressDebugLogging } from '../../../src/utils/debug';
import { LRUCache } from '../../../src/utils/lru';
import { TestOutput } from '../../testoutput';
import { Address } from '../../../src/msgs';
import { computeSignatureHash } from '../../../src/abi/signature';
import { getStorageAt, getCode } from '../../../src/eth/requests';
import { abiDecodeParameters } from '../../../src/abi/wasm';
import { ContractBytecode } from '../../../src/eth/evm';
import { isTransparentProxy, getTransparentProxyImplementationAddress } from '../../../src/eth/proxy';
import { EthereumTransport } from '../../../src/eth/transport';

let logHandle: any;
beforeEach(() => {
    // enableTraceLogging('ethlogger:abi:proxy:*');
    logHandle = suppressDebugLogging();
});
afterEach(() => {
    logHandle.restore(); //.forEach((m: any[]) => console.log(...m));
});

const recorderTest = (
    name: string,
    options: { replay: boolean; rpcUrl?: string },
    testFn: (transport: EthereumTransport) => Promise<void>
) =>
    test(name, () =>
        withRecorder(
            new HttpTransport(options.rpcUrl || 'https://dai.poa.network', {}),
            {
                name: `testcases-proxy-${name.replace(/\s+/g, '-')}`,
                storageDir: join(__dirname, '../../fixtures/recorded'),
                replay: options.replay,
            },
            testFn
        )
    );

recorderTest('isTransparentProxy', { replay: true }, async transport => {
    const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });

    const proxyContract = '0x1224C2D4461aD0841A181Fe6b17B493708BC4ce9';
    const proxyContractCode = new ContractBytecode(await ethClient.request(getCode(proxyContract)));
    await expect(isTransparentProxy(proxyContractCode, proxyContract, ethClient)).resolves.toBe(true);

    const regularContract = '0x4c0EB450d8Dfa6E89eB14AC154867bC86B3c559C';
    const regularContractCode = new ContractBytecode(await ethClient.request(getCode(regularContract)));
    await expect(isTransparentProxy(regularContractCode, regularContract, ethClient)).resolves.toBe(false);
});

recorderTest('getTransparentProxyImplementationAddress', { replay: true }, async transport => {
    const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
    const proxyContract = '0x1224C2D4461aD0841A181Fe6b17B493708BC4ce9';
    const regularContract = '0x4c0EB450d8Dfa6E89eB14AC154867bC86B3c559C';

    await expect(
        getTransparentProxyImplementationAddress(proxyContract, 'latest', ethClient)
    ).resolves.toMatchInlineSnapshot(`"0x4c0EB450d8Dfa6E89eB14AC154867bC86B3c559C"`);

    await expect(
        getTransparentProxyImplementationAddress(regularContract, 'latest', ethClient)
    ).resolves.toMatchInlineSnapshot(`undefined`);
});

recorderTest(
    'getTransparentProxyImplementationAddress-rinkeby',
    { replay: false, rpcUrl: 'https://rinkeby.infura.io/v3/d0cf2282b6144d45aacdeff5fa256a4c' },
    async transport => {
        const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
        const proxyContract = '0xdf82c9014f127243ce1305dfe54151647d74b27a';
        await expect(
            getTransparentProxyImplementationAddress(proxyContract, 'latest', ethClient)
        ).resolves.toMatchInlineSnapshot(`"0x48317e7bF015ECdAaa1c957b5e8526eD4B40202e"`);
        await expect(
            getTransparentProxyImplementationAddress(proxyContract, 6475886, ethClient)
        ).resolves.toMatchInlineSnapshot(`"0xb970ab7e46f37235D6F878eE37eEaEcfd2046eC2"`);
    }
);

// test('isTransparentProxy', async () => {
//     await );

// test('proxy', async () => {
//     enableTraceLogging();
//     debugModule.enable('ethlogger:abi:*');
//     await withRecorder(
//         new HttpTransport('https://dai.poa.network', {}),
//         {
//             name: `testcases-proxy`,
//             storageDir: join(__dirname, '../../fixtures/recorded'),
//             replay: true,
//         },
//         async transport => {
//             const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
//             const abiRepo = new AbiRepository({
//                 decodeAnonymous: true,
//                 fingerprintContracts: true,
//                 abiFileExtension: '.json',
//                 directory: undefined, //join(__dirname, 'foo'),
//                 searchRecursive: true,
//                 requireContractMatch: true,
//             });
//             await abiRepo.initialize();
//             const checkpoints = new Checkpoint({
//                 initialBlockNumber: 0,
//                 path: join(__dirname, '../../../tmp/tmpcheckpoint.json'),
//                 saveInterval: 10000,
//             });
//             const output = new TestOutput();
//             const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 100 });
//             const blockWatcher = new BlockWatcher({
//                 abiRepo,
//                 checkpoints,
//                 chunkSize: 1,
//                 ethClient,
//                 maxParallelChunks: 1,
//                 output,
//                 pollInterval: 1,
//                 startAt: 'latest',
//                 chunkQueueMaxSize: 10,
//                 contractInfoCache,
//                 waitAfterFailure: 1,
//             });

//             const PROXY = '0x1224C2D4461aD0841A181Fe6b17B493708BC4ce9';

//             // console.log('>>>', computeSignatureHash('()', 'function'));
//             console.log('>>>', computeSignatureHash('AdminChanged(address,address)', 'event'));
//             console.log('>>>', computeSignatureHash('Upgraded(address)', 'event'));

//             // const info = await blockWatcher.lookupContractInfo(PROXY);

//             await getContractInfo(PROXY, ethClient, sig => {
//                 const f = abiRepo.getMatchingAbi(sig);
//                 console.log('sig', f);
//                 return undefined;
//             });
//         }
//     );
// }, 15000);

// test('proxy2', async () => {
//     enableTraceLogging();
//     debugModule.enable('ethlogger:abi:*');
//     await withRecorder(
//         new HttpTransport('https://eth-rinkeby.alchemyapi.io/v2/G6hrNOtcVWYJssrmwd18Sd99CAx9C-wP', {}),
//         {
//             name: `testcases-proxy2`,
//             storageDir: join(__dirname, '../../fixtures/recorded'),
//             replay: false,
//         },
//         async transport => {
//             const ethClient = new BatchedEthereumClient(transport, { maxBatchSize: 100, maxBatchTime: 0 });
//             const abiRepo = new AbiRepository({
//                 decodeAnonymous: true,
//                 fingerprintContracts: true,
//                 abiFileExtension: '.json',
//                 directory: join(__dirname, 'proxyabi'),
//                 searchRecursive: true,
//                 requireContractMatch: true,
//             });
//             await abiRepo.initialize();
//             const checkpoints = new Checkpoint({
//                 initialBlockNumber: 0,
//                 path: join(__dirname, '../../../tmp/tmpcheckpoint.json'),
//                 saveInterval: 10000,
//             });
//             const output = new TestOutput();
//             const contractInfoCache = new LRUCache<string, Promise<ContractInfo>>({ maxSize: 100 });
//             const blockWatcher = new BlockWatcher({
//                 abiRepo,
//                 checkpoints,
//                 chunkSize: 1,
//                 ethClient,
//                 maxParallelChunks: 1,
//                 output,
//                 pollInterval: 1,
//                 startAt: 'latest',
//                 chunkQueueMaxSize: 10,
//                 contractInfoCache,
//                 waitAfterFailure: 1,
//             });

//             const PROXY = '0xdf82c9014f127243ce1305dfe54151647d74b27a';

//             // console.log('>>>', computeSignatureHash('()', 'function'));
//             // console.log('>>>', computeSignatureHash('AdminChanged(address,address)', 'event'));
//             // console.log('>>>', computeSignatureHash('Upgraded(address)', 'event'));

//             // const info = await blockWatcher.lookupContractInfo(PROXY);

//             // await getContractInfo(PROXY, ethClient, sig => {
//             //     const f = abiRepo.getMatchingAbi(sig);
//             //     console.log('sig', sig, f);
//             //     return undefined;
//             // });

//             // try {
//             //     const r = getLogs({
//             //         address: PROXY,
//             //         fromBlock: 'earliest',
//             //         topics: ['0x' + computeSignatureHash('Upgraded(address)', 'event')],
//             //         //fromBlock: 0,
//             //     });
//             //     console.log(r);
//             //     const logs = await ethClient.request(r, { immediate: true });
//             //     console.log(logs);
//             // } catch (e) {
//             //     console.log(e.response);
//             // }

//             const r: string = await ethClient.request(
//                 getStorageAt(PROXY, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc')
//             );
//             //     {
//             //     method: 'eth_getStorageAt',
//             //     params: [
//             //         PROXY,
//             //         '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
//             //         '0x' + (6475887).toString(16),
//             //     ],
//             // });
//             console.log(typeof r, r);
//             console.log(abiDecodeParameters(r.slice(2), ['address']));
//         }
//     );
// }, 15000);
