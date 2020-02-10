import { NodePlatformAdapter } from '.';
import { EthereumClient } from '../eth/client';
import { JsonRpcError } from '../eth/jsonrpc';
import { KNOWN_NETOWORK_NAMES, lookupKnownNetwork } from '../eth/networks';
import {
    blockNumber,
    clientVersion,
    gasPrice,
    hashRate,
    netVersion,
    peerCount,
    pendingTransactions,
    protocolVersion,
    syncing,
    EthRequest,
    chainId,
} from '../eth/requests';
import { formatPendingTransaction } from '../format';
import { NodeInfo, PendingTransactionMessage, NodeMetricsMessage } from '../msgs';
import { OutputMessage } from '../output';
import { bigIntToNumber } from '../utils/bn';
import { createModuleDebug } from '../utils/debug';
import { prefixKeys } from '../utils/obj';

const { debug, warn, error } = createModuleDebug('platforms:generic');

export async function checkRpcMethodSupport(eth: EthereumClient, req: EthRequest<[], any>): Promise<boolean> {
    try {
        debug('Checking if RPC method %s is supported by ethereum node', req.method);
        await eth.request(req, { immediate: true });
        debug('Ethereum node seems to support RPC method %s', req.method);
        return true;
    } catch (e) {
        warn('RPC method %s is not supported by ethereum node: %s', req.method, e.message);
        return false;
    }
}

export async function captureDefaultMetrics(
    eth: EthereumClient,
    captureTime: number,
    supports: { hashRate?: boolean; peerCount?: boolean } = {}
): Promise<NodeMetricsMessage> {
    const [blockNumberResult, hashRateResult, peerCountResult, gasPriceResult, syncStatus] = await Promise.all([
        eth.request(blockNumber()),
        supports.hashRate === false ? undefined : eth.request(hashRate()),
        supports.peerCount === false ? undefined : eth.request(peerCount()),
        eth
            .request(gasPrice())
            .then(value => bigIntToNumber(value))
            .catch(e => {
                warn('Error obtaining gas price: %s', e.message);
                return undefined;
            }),
        eth.request(syncing()),
    ]);
    return {
        type: 'nodeMetrics',
        time: captureTime,
        metrics: {
            blockNumber: blockNumberResult,
            hashRate: hashRateResult,
            peerCount: peerCountResult,
            gasPrice: gasPriceResult,
            ...(syncStatus ? prefixKeys(syncStatus, 'syncing.', true) : undefined),
        },
    };
}

export async function fetchPendingTransactions(eth: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    const pendingTxs = await eth.request(pendingTransactions());

    return [
        {
            type: 'nodeMetrics',
            time: captureTime,
            metrics: {
                pendingTransactionCount: pendingTxs.length,
            },
        },
        ...pendingTxs.map(
            tx =>
                ({
                    type: 'pendingtx',
                    time: captureTime,
                    body: formatPendingTransaction(tx, 'pending'),
                } as PendingTransactionMessage)
        ),
    ];
}

export interface DefaultNodeInfo {
    networkId?: number;
    chainId?: number;
    protocolVersion?: number;
}

export async function fetchDefaultNodeInfo(ethClient: EthereumClient): Promise<DefaultNodeInfo> {
    const [networkId, chainIdResult, protocol] = await Promise.all([
        ethClient.request(netVersion()),
        ethClient.request(chainId()),
        ethClient.request(protocolVersion()),
    ]);
    return { networkId, chainId: chainIdResult, protocolVersion: protocol };
}

export async function checkPendingTransactionsMethodSupport(ethClient: EthereumClient): Promise<boolean> {
    try {
        debug('Checking if generic node supports pendingTranscations RPC method');
        await ethClient.request(pendingTransactions());
        debug('Pending transactions seem to be supported');
        return true;
    } catch (e) {
        if (e instanceof JsonRpcError) {
            warn('Generic node does not seem to support the eth_pendingTransactions RPC method', e);
            return false;
        } else {
            error('Encountered unexpected error while checking for pendingTransaction method support', e);
            return false;
        }
    }
}

export class GenericNodeAdapter implements NodePlatformAdapter {
    protected nodeInfo?: NodeInfo;
    protected supports: { pendingTransactions: boolean; hashRate: boolean; peerCount: boolean } | undefined;

    constructor(protected clientVersion: string, protected chain?: string, protected network?: string) {}

    public async initialize(ethClient: EthereumClient) {
        this.nodeInfo = await this.captureNodeInfo(ethClient);

        if (this.network == null || this.chain == null) {
            if (this.nodeInfo != null && this.nodeInfo.chainId != null && this.nodeInfo.networkId != null) {
                const knownNetwork = await lookupKnownNetwork({
                    chainId: this.nodeInfo.chainId,
                    networkId: this.nodeInfo.networkId,
                });
                if (knownNetwork != null && this.chain == null) {
                    this.chain = knownNetwork.chain;
                }
                if (knownNetwork != null && this.network == null) {
                    this.network = knownNetwork.network;
                }
            } else if (this.nodeInfo?.networkId != null) {
                this.network = KNOWN_NETOWORK_NAMES[this.nodeInfo?.networkId];
            }
        }

        const [supportsPendingTransactions, supportsHashRate, supportsPeerCount] = await Promise.all([
            checkRpcMethodSupport(ethClient, pendingTransactions()),
            checkRpcMethodSupport(ethClient, hashRate()),
            checkRpcMethodSupport(ethClient, peerCount()),
        ]);
        this.supports = {
            pendingTransactions: supportsPendingTransactions,
            hashRate: supportsHashRate,
            peerCount: supportsPeerCount,
        };
    }

    public async captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo> {
        const [defaultInfo, version] = await Promise.all([
            fetchDefaultNodeInfo(ethClient),
            ethClient.request(clientVersion()),
        ]);

        const name = version.slice(0, version.indexOf('/'));
        debug('Extracted ethereum node name %o from clientVersion response', name);

        return {
            transport: ethClient.transport.source,
            enode: null,
            networkId: defaultInfo.networkId ?? null,
            network: this.networkName,
            chainId: defaultInfo.chainId ?? null,
            chain: this.chainName,
            protocolVersion: defaultInfo.protocolVersion ?? null,
            clientVersion: version,
            platform: `generic:${name}`,
        };
    }

    public get fullVersion(): string {
        return this.nodeInfo?.clientVersion ?? this.clientVersion;
    }

    public get name(): string {
        return this.nodeInfo?.platform ?? 'generic:unknown';
    }

    public get enode(): string | null {
        return this.nodeInfo?.enode ?? null;
    }

    public get networkId(): number | null {
        return this.nodeInfo?.networkId ?? null;
    }

    public get chainId(): number | null {
        return this.nodeInfo?.chainId ?? null;
    }

    public get networkName(): string | null {
        return this.network ?? null;
    }

    public get chainName(): string | null {
        return this.chain ?? null;
    }

    public get protocolVersion(): number | null {
        return this.nodeInfo?.protocolVersion ?? null;
    }

    public async captureNodeMetrics(
        ethClient: EthereumClient,
        captureTime: number
    ): Promise<NodeMetricsMessage[] | NodeMetricsMessage> {
        return await captureDefaultMetrics(ethClient, captureTime, this.supports);
    }

    public async capturePendingTransactions(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
        return fetchPendingTransactions(ethClient, captureTime);
    }

    public async supportsPendingTransactions(): Promise<boolean> {
        return this.supports?.pendingTransactions ?? false;
    }
}
