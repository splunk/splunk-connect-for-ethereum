import { GethPeer } from './eth/responses';

export type Address = string;
export type Value = string | number | boolean | Array<string | number | boolean>;

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
    difficulty: number | string;
    /** integer of the total difficulty of the chain until this block */
    totalDifficulty: number | string;
    /** the maximum gas allowed in this block */
    gasLimit: number | string;
    /** the total used gas by all transactions in this block */
    gasUsed: number | string;
    /** the unix timestamp (seconds since epoch) for when the block was collated */
    timestamp: number | string;
    /** the "extra data" field of this block */
    extraData: string;
    /** hash of the generated proof-of-work */
    nonce: string | null;
    /** integer the size of this block in bytes */
    size: number;
    /** Array of uncle hashes */
    uncles: string[];

    // additional/computed information

    /** number of transactions in this block */
    transactionCount: number;
}

export interface BlockMessage {
    type: 'block';
    time: number;
    body: FormattedBlock;
}

export interface BaseFormattedTransaction {
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
    nonce: number;
    /** value transferred in Wei */
    value: number | string;
    /** ECDSA recovery id */
    v: string;
    /** ECDSA signature r */
    r: string;
    /** ECDSA signature s */
    s: string;

    // additional info

    /** Information about the recipient address of the transaction */
    toInfo?: AddressInfo;
    /** Information about the sender address of the transaction */
    fromInfo?: AddressInfo;
    /** Information about the function extracted from `input` if ABI information is available */
    call?: FunctionCall;
}

export interface FormattedPendingTransaction extends BaseFormattedTransaction {
    type: 'pending' | 'queued';
}

export interface PendingTransactionMessage {
    type: 'pendingtx';
    time: number;
    body: FormattedPendingTransaction;
}

/** Transaction and transaction receipt information formatted for output */
export interface FormattedTransaction extends BaseFormattedTransaction {
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
    contractAddress: Address | null;

    // additional/computed information

    /** Information about the created contract address */
    contractAddressInfo?: AddressInfo;
}

export interface AddressInfo {
    /** true if the address is a contract, otherwise false. This is determined by attempting to retrieve code stored at the address (if any) */
    isContract: boolean;
    /** Name of the smart contract by matching it against configured ABI information */
    contractName?: string;
}

export interface FunctionCall {
    /** Function name */
    name: string;
    /** Function signature (name and parameter types) */
    signature: string;
    /** List of decoded parameters */
    params: Array<{
        /** Paramter name - omitted if the function call was decoded anonymously */
        name?: string;
        /** Data type */
        type: string;
        /** Decoded value */
        value: Value;
    }>;
    /**
     * A map of parameter names and their decoded value.
     * Omitted if the function call was decoded anonymously
     */
    args?: { [name: string]: Value };
}

export interface TransactionMessage {
    type: 'transaction';
    time: number;
    body: FormattedTransaction;
}

export interface FormattedLogEvent {
    /** true when the log was removed, due to a chain reorganization. false if its a valid log */
    removed?: boolean;
    /** integer of the log index position in the block  */
    logIndex: number | null;
    /** the block number where this log is located */
    blockNumber: number | null;
    /** hash of the block where this log is located */
    blockHash: string | null;
    /** hash of the transaction where this log was created */
    transactionHash: string | null;
    /** integer index position of this transaction in it's block */
    transactionIndex: number | null;
    /** contract address from which this log originated */
    address: Address;
    /** contains the non-indexed arguments of the log */
    data: string;
    /** Array of 0 to 4 32 Bytes DATA of indexed log arguments.
     * (In solidity: The first topic is the hash of the signature of the event
     * (e.g. Deposit(address,bytes32,uint256)),
     * except you declared the event with the anonymous specifier.) */
    topics: string[];

    // additional/computed information

    /** Information about the address emitting this event */
    addressInfo?: AddressInfo;
    /** Decoded event name, signature and parameters */
    event?: EventData;
}

export interface EventData {
    /** Event name */
    name: string;
    /** Event signature (name and parameter types) */
    signature: string;
    /** List of decoded parameters */
    params: Array<{
        /** Paramter name - omitted if the event call was decoded anonymously */
        name?: string;
        /** Data type */
        type: string;
        /** Decoded value */
        value: Value;
    }>;
    /** A map of parameter names and their decoded value. Omitted if decoded anonymously */
    args?: { [name: string]: Value };
}

export interface LogEventMessage {
    type: 'event';
    time: number;
    body: FormattedLogEvent;
}

export interface NodeInfo {
    /** Detected node platform via introspection of web3_clientVersion */
    platform: string;
    /** Full client version string retrieved from the node */
    clientVersion: string;
    /** enode (only if we were able to determine it) */
    enode: string | null;
    /** Network ID retrieved from the node */
    networkId: number | null;
    /** Chain ID is the currently configured CHAIN_ID value used for signing replay-protected transactions, introduced via EIP-155 */
    chainId: number | null;
    /** Name of the network (if supplied or auto-detected) */
    network: string | null;
    /** Ethereum protocol version */
    protocolVersion: number | null;
    /** Describes transport used to access node information (jsonprc+URL)  */
    transport: string;

    /** Detailed information from the quorum consensus mechanism */
    quorumProtocol?: QuorumProtocolInfo;

    [k: string]: any;
}

export interface NodeInfoMessage {
    type: 'nodeInfo';
    time: number;
    body: NodeInfo;
}

export interface GethPeerMessage {
    type: 'gethPeer';
    time: number;
    body: GethPeer;
}

export interface QuorumProtocolInfo {
    consensusMechanism: 'istanbul' | 'raft';
    [k: string]: any;
}

export interface NodeMetrics {
    /** The current price per gas in wei */
    gasPrice?: number;
    /** The number of hashes per second that the node is mining with */
    hashRate?: number;
    /** The number of peers currently connected to the client */
    peerCount?: number;
    /** The number of transactions currently pending */
    pendingTransactionCount?: number;
    /** If the node is syncing: the current block, same as eth_blockNumber */
    'syncing.currentBlock'?: number;
    /** If the node is syncing: the block at which the import started (will only be reset, after the sync reached his head) */
    'syncing.startingBlock'?: number;
    /** If the node is syncing: estimated highest block */
    'syncing.highestBlock'?: number;
    /** Only for geth nodes: Number of pending transaactions in txpool */
    'geth.txpool.pending'?: number;
    /** Only for geth nodes: Number of queued transaactions in txpool */
    'geth.txpool.queued'?: number;
    /** Other, platform-specific metrics */
    [name: string]: number | undefined;
}

export interface NodeMetricsMessage {
    type: 'nodeMetrics';
    time: number;
    metrics: NodeMetrics;
}
