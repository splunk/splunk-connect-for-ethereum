import { NodePlatformAdapter } from '.';
import { EthereumClient } from '../eth/client';
import { JsonRpcError } from '../eth/jsonrpc';
import { KNOWN_NETOWORK_NAMES } from '../eth/networks';
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
} from '../eth/requests';
import { formatPendingTransaction } from '../format';
import { NodeInfo, PendingTransactionMessage } from '../msgs';
import { OutputMessage } from '../output';
import { bigIntToNumber } from '../utils/bn';
import { createModuleDebug } from '../utils/debug';
import { prefixKeys } from '../utils/obj';

const { debug, warn, error } = createModuleDebug('platforms:generic');

export async function captureDefaultMetrics(eth: EthereumClient, captureTime: number): Promise<OutputMessage> {
    const [blockNumberResult, hashRateResult, peerCountResult, gasPriceResult, syncStatus] = await Promise.all([
        eth.request(blockNumber()),
        eth.request(hashRate()),
        eth.request(peerCount()),
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
    protocolVersion?: number;
}

export async function fetchDefaultNodeInfo(ethClient: EthereumClient): Promise<DefaultNodeInfo> {
    const [networkId, protocol] = await Promise.all([
        ethClient.request(netVersion()),
        ethClient.request(protocolVersion()),
    ]);
    return { networkId, protocolVersion: protocol };
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
    private nodeInfo?: NodeInfo;
    private supportsPendingTransactions?: boolean;

    constructor(private clientVersion: string, private network?: string) {}

    public async initialize(ethClient: EthereumClient) {
        await this.captureNodeInfo(ethClient);
        this.supportsPendingTransactions = await checkPendingTransactionsMethodSupport(ethClient);
    }

    public async captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo> {
        const [defaultInfo, version] = await Promise.all([
            fetchDefaultNodeInfo(ethClient),
            ethClient.request(clientVersion()),
        ]);

        const name = version.slice(0, version.indexOf('/'));
        debug('Extracted ethereum node name %o from clientVersion response', name);

        this.nodeInfo = {
            transport: ethClient.transport.source,
            enode: null,
            networkId: defaultInfo.networkId ?? null,
            protocolVersion: defaultInfo.protocolVersion ?? null,
            clientVersion: version,
            platform: `generic:${name}`,
            network: this.networkName,
        };
        return this.nodeInfo;
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

    public get networkName(): string | null {
        return this.network ?? (this.networkId != null ? KNOWN_NETOWORK_NAMES[this.networkId] : null) ?? null;
    }

    public get protocolVersion(): number | null {
        return this.nodeInfo?.protocolVersion ?? null;
    }

    public async captureNodeStats(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
        const results = await Promise.all([
            captureDefaultMetrics(ethClient, captureTime),
            this.supportsPendingTransactions ? fetchPendingTransactions(ethClient, captureTime) : [],
        ]);
        return results.flat(1);
    }
}
