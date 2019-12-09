import { numberToHex } from 'web3-utils';
import { bigIntToNumber, parseBigInt } from '../utils/bn';
import { JsonRpcResponse } from './jsonrpc';
import {
    GethMemStats,
    GethMetrics,
    GethNodeInfo,
    GethTxpool,
    ParityMode,
    ParityNodeKind,
    ParityPeers,
    ParityPendingTransaction,
    RawBlockResponse,
    RawTransactionReceipt,
} from './responses';

export interface EthRequest<P extends any[], R> {
    method: string;
    params?: P;
    response?: (r: JsonRpcResponse) => R;
}

export const blockNumber = (): EthRequest<[], number> => ({
    method: 'eth_blockNumber',
    response: (r: JsonRpcResponse) => bigIntToNumber(r.result),
});

export const getBlock = (
    blockNumber: number | 'latest' | 'pending'
): EthRequest<[string, boolean], RawBlockResponse> => ({
    method: 'eth_getBlockByNumber',
    params: [typeof blockNumber === 'number' ? numberToHex(blockNumber) : blockNumber, true],
});

export const getTransactionReceipt = (txHash: string): EthRequest<[string], RawTransactionReceipt> => ({
    method: 'eth_getTransactionReceipt',
    params: [txHash],
});

export const getCode = (address: string): EthRequest<[string, string], string> => ({
    method: 'eth_getCode',
    params: [address, 'latest'],
});

/** Returns the current client version */
export const clientVersion = (): EthRequest<[], string> => ({
    method: 'web3_clientVersion',
});

/** Returns true if client is actively mining new blocks */
export const mining = (): EthRequest<[], boolean> => ({
    method: 'eth_mining',
});

/** Returns the number of hashes per second that the node is mining with */
export const hashRate = (): EthRequest<[], number> => ({
    method: 'eth_hashrate',
    response: r => bigIntToNumber(r.result),
});

/** Returns the current price per gas in wei */
export const gasPrice = (): EthRequest<[], number | string> => ({
    method: 'eth_gasPrice',
    response: r => parseBigInt(r.result),
});

/** Returns number of peers currently connected to the client */
export const peerCount = (): EthRequest<[], number> => ({
    method: 'net_peerCount',
    response: r => bigIntToNumber(r.result),
});

// Geth specific requests

export const gethNodeInfo = (): EthRequest<[], GethNodeInfo> => ({
    method: 'admin_nodeInfo',
});

export const gethMetrics = (param: boolean): EthRequest<[boolean], GethMetrics> => ({
    method: 'debug_metrics',
    params: [param],
});

export const gethMemStats = (): EthRequest<[], GethMemStats> => ({
    method: 'debug_memStats',
});

export const gethTxpool = (): EthRequest<[], GethTxpool> => ({
    method: 'txpool_content',
});

// Quorum specific requests

export const quroumIstanbulSnapshot = (): EthRequest<[], any> => ({
    method: 'istanbul_getSnapshot',
});

export const quorumIstanbulCandidates = (): EthRequest<[], any> => ({
    method: 'istanbul_candidates',
});

export const quorumRaftRole = (): EthRequest<[], any> => ({
    method: 'raft_role',
});

export const quorumRaftLeader = (): EthRequest<[], any> => ({
    method: 'raft_leader',
});

export const quorumRaftCluster = (): EthRequest<[], any> => ({
    method: 'raft_cluster',
});

// Parity specific requests

/** Returns the node enode URI */
export const parityEnode = (): EthRequest<[], string> => ({
    method: 'parity_enode',
});

export const parityMode = (): EthRequest<[], ParityMode> => ({
    method: 'parity_mode',
});

export const parityNodeKind = (): EthRequest<[], ParityNodeKind> => ({
    method: 'parity_nodeKind',
});

export const parityPeers = (): EthRequest<[], ParityPeers> => ({
    method: 'parity_netPeers',
});

export const parityPendingTransactions = (): EthRequest<[], ParityPendingTransaction[]> => ({
    method: 'parity_pendingTransactions',
});
