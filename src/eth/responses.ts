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
