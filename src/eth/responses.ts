export interface RawBlockHeaderResponse {
    hash: string | null;
    parentHash: string;
    sha3Uncles: string;
    miner: string;
    stateRoot: string;
    transactionsRoot: string;
    receiptsRoot: string;
    logsBloom: string | null;
    difficulty: string;
    number: string | null;
    gasLimit: string;
    gasUsed: string;
    timestamp: string;
    extraData: string;
    nonce: string | null;
}

export interface RawBlockResponse extends RawBlockHeaderResponse {
    totalDifficulty: string;
    size: string;
    transactions: (RawTransactionResponse | string)[];
    uncles: string[];
}

export interface RawTransactionResponse {
    blockHash: string | null;
    blockNumber: string | null;
    from: string;
    gas: string;
    gasPrice: string;
    hash: string;
    input: string;
    nonce: string;
    to: string | null;
    transactionIndex: string | null;
    value: string;
    v: string;
    r: string;
    s: string;
}

export interface RawTransactionReceipt {
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    blockNumber: string;
    from: string;
    to?: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    contractAddress?: string;
    logs?: RawLogResponse[];
    status?: string;
}

export interface RawLogResponse {
    id?: string;
    removed?: boolean;
    logIndex: string | null;
    blockNumber: string | null;
    blockHash: string | null;
    transactionHash: string | null;
    transactionIndex: string | null;
    address: string;
    data: string;
    topics: string[];
}

export type SyncStatus =
    /** The node is not syncing if SyncStatus is false */
    | false
    | {
          /** The block at which the import started (will only be reset, after the sync reached his head) */
          startingBlock: number;
          /** The current block, same as eth_blockNumber */
          currentBlock: number;
          /** The estimated highest block */
          highestBlock: number;
      };

export interface GethNodeInfoResponse {
    enode: string;
    id: string;
    ip: string;
    listenAddr: string;
    name: string;
    ports: {
        discovery: number;
        listener: number;
    };
    protocols: {
        eth?: {
            difficulty: number | string;
            genesis: string;
            head: string;
            network: number;
            [k: string]: any;
        };
        [k: string]: any;
    };
}

export type GethMetrics = {
    [k: string]: number | string | GethMetrics | any;
};

// See https://golang.org/pkg/runtime/#MemStats
export type GethMemStats = {
    BySize?: Array<{ Size: number; Mallocs: number; Frees: number }>;
} & {
    [name: string]: number | string | any[] | object;
};

export interface GethTxpoolMap {
    [originAddress: string]: { [nounce: string]: RawTransactionResponse[] };
}

export interface GethTxpool {
    pending: GethTxpoolMap;
    queued: GethTxpoolMap;
}

export interface GethPeer {
    enode: string;
    id: string;
    name: string;
    caps?: string[];
    network: {
        localAddress: string;
        remoteAddress: string;
        inbound: boolean;
        trusted: boolean;
        static: boolean;
        [k: string]: any;
    };
    protocols: {
        [k: string]: any;
    };
    [k: string]: any;
}

export interface BalanceBody {
    contract: string;
    blockHash: string;
    blockNumber: number;
    account: string;
    balance: string;
    ethBalance: string | undefined;
}

export interface NftBody {
    from: string;
    to: string;
    fromEthBalance: string | undefined;
    toEthBalance: string | undefined;
    tokenIndex: string;
    rawTokenURI: string | undefined;
    tokenURI: string | undefined;
    errorTokenURI: any | undefined;
    metadata: any;
    contract: string;
    blockHash: string;
    blockNumber: number;
    transactionHash: string;
    retrievalTime: number | string;
}

export type GethPeers = GethPeer[];

export interface ParityNodeKind {
    availability: 'personal' | 'public';
    capability: 'full' | 'light';
}

export interface ParityPeers {
    active: number;
    connected: number;
    max: number;
    peers: any[];
}

export type ParityMode = 'active' | 'passive' | 'dark' | 'offline';

export interface ParityPendingTransaction extends RawTransactionResponse {
    hash: string;
    nonce: string;
    blockHash: null;
    blockNumber: null;
    transactionIndex: null;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gas: string;
    input: string;
    creates: string;
    raw: string;
    publicKey: string;
    chainId: string;
    standardV: string;
    v: string;
    r: string;
    s: string;
    condition: { time: string } | { block: string } | null;
    // Object - (optional) Conditional submission, Block number in block or timestamp in time or null.
}
