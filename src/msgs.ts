export type Address = string;

/** Block information formatted for output */
export interface FormattedBlock {
    /** the block number */
    number: number | null;
    /** hash of the block */
    hash: string | null;
    /** hash of the parent block */
    parentHash: string;
    /** SHA3 of the uncles data in the block */
    sha3Uncles: string;
    /** the address of the beneficiary to whom the mining rewards were given */
    miner: Address;
    /** the root of the final state trie of the block */
    stateRoot: string;
    /** the root of the transaction trie of the block */
    transactionsRoot: string;
    /** the root of the receipts trie of the block */
    receiptsRoot: string;
    /** the bloom filter for the logs of the block */
    logsBloom: string | null;
    /** integer of the difficulty for this block */
    difficulty: number;
    /** integer of the total difficulty of the chain until this block */
    totalDifficulty: number;
    /** the maximum gas allowed in this block */
    gasLimit: number;
    /** the total used gas by all transactions in this block */
    gasUsed: number;
    /** the unix timestamp (seconds since epoch) for when the block was collated */
    timestamp: number;
    /** the "extra data" field of this block */
    extraData: string;
    /** hash of the generated proof-of-work */
    nonce: string | null;
    /** integer the size of this block in bytes */
    size: number;
    /** Array of uncle hashes */
    uncles: string[];

    // addative

    /** number of transactions in this block */
    transactionCount: number;
}

export interface BlockMessage {
    type: 'block';
    time: number;
    block: FormattedBlock;
}

export interface FormattedPendingTransaction {
    /** hash of the transaction */
    hash: string;
    /** address of the sender */
    from: Address;
    /** address of the receiver. null when its a contract creation transaction */
    to: Address | null;
    /** gas provided by the sender */
    gas: number;
    /** gas price provided by the sender in Wei */
    gasPrice: number;
    /** the data send along with the transaction */
    input: string;
    /** the number of transactions made by the sender prior to this one */
    nonce: string;
    /** value transferred in Wei */
    value: string;
    /** ECDSA recovery id */
    v: string;
    /** ECDSA signature r */
    r: string;
    /** ECDSA signature s */
    s: string;
}

export interface PendingTransactionMessage {
    type: 'transaction:pending';
    time: number;
    tx: FormattedPendingTransaction;
}

/** Transaction and transaction receipt information formatted for output */
export interface FormattedTransaction extends FormattedPendingTransaction {
    /** hash of the block where this transaction was in */
    blockHash: string | null;
    /** integer of the transaction's index position in the block */
    transactionIndex: number | null;

    // additional info

    /** number of the block where this transaction was in */
    blockNumber: number | null;

    // receipt information

    /** Success or failure state of the transaction receipt */
    status: 'success' | 'failure' | null;
    /** The amount of gas used by this specific transaction alone */
    gasUsed: number;
    /** The total amount of gas used when this transaction was executed in the block */
    cumulativeGasUsed: number;
    /** The contract address created, if the transaction was a contract creation, otherwise null  */
    contractAddress?: Address | null;

    // ... wip

    // toInfo: {
    //     isContract: boolean;
    //     // other stuff? ENS?
    // };

    // call: {
    //     params: any[];
    //     args: { [k: string]: any };
    // };
}

export interface TransactionMessage {
    type: 'transaction';
    time: number;
    tx: FormattedTransaction;
}
