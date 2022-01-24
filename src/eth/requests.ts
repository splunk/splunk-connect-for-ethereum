import { bigIntToNumber, numberToHex } from '../utils/bn';
import { JsonRpcResponse } from './jsonrpc';
import {
    GethMemStats,
    GethMetrics,
    GethNodeInfoResponse,
    GethPeers,
    GethTxpool,
    ParityMode,
    ParityNodeKind,
    ParityPeers,
    ParityPendingTransaction,
    RawBlockResponse,
    RawTransactionReceipt,
    RawTransactionResponse,
    SyncStatus,
} from './responses';
import { sha3 } from '../abi/wasm';

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

export const pendingTransactions = (): EthRequest<[], RawTransactionResponse[]> => ({
    method: 'eth_pendingTransactions',
});

/** Returns the current client version */
export const clientVersion = (): EthRequest<[], string> => ({
    method: 'web3_clientVersion',
});

/** Returns the current network id */
export const netVersion = (): EthRequest<[], number> => ({
    method: 'net_version',
    response: r => bigIntToNumber(r.result),
});

/** Returns the chain ID - see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-695.md */
export const chainId = (): EthRequest<[], number> => ({
    method: 'eth_chainId',
    response: r => bigIntToNumber(r.result),
});

/** Returns the current ethereum protocol version */
export const protocolVersion = (): EthRequest<[], number> => ({
    method: 'eth_protocolVersion',
    response: r => bigIntToNumber(r.result),
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
    response: r => bigIntToNumber(r.result),
});

/** Returns number of peers currently connected to the client */
export const peerCount = (): EthRequest<[], number> => ({
    method: 'net_peerCount',
    response: r => bigIntToNumber(r.result),
});

/** Returns an object with sync status data or FALSE, when not syncing */
export const syncing = (): EthRequest<[], SyncStatus> => ({
    method: 'eth_syncing',
});

// Geth specific requests

export const gethNodeInfo = (): EthRequest<[], GethNodeInfoResponse> => ({
    method: 'admin_nodeInfo',
});

export const gethPeers = (): EthRequest<[], GethPeers> => ({
    method: 'admin_peers',
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

export const quorumIstanbulSnapshot = (): EthRequest<[], any> => ({
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

export const quorumPrivateTransactionPayload = (id: string): EthRequest<[string], string> => ({
    method: 'eth_getQuorumPayload',
    params: [id],
});

export const ethCall = (
    contractAddress: string,
    methodSignature: string,
    params: string[],
    blockNumber: number
): EthRequest<[{ to: string; data: string }, string], string> => ({
    method: 'eth_call',
    params: [
        { to: contractAddress, data: sha3(methodSignature)?.substr(0, 10) + params.join() },
        '0x' + blockNumber.toString(16),
    ],
});

export const ethBalance = (account: string, blockNumber: number): EthRequest<[string, string], string> => ({
    method: 'eth_getBalance',
    params: [account, '0x' + blockNumber.toString(16)],
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
