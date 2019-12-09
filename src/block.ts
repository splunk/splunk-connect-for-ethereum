import { AbiDecoder } from './abi';
import { BlockRange, blockRangeSize, blockRangeToArray, chunkedBlockRanges } from './blockrange';
import { BlockRangeCheckpoint } from './checkpoint';
import { ContractInfo, getContractInfo } from './contract';
import { EthereumClient } from './eth/client';
import { blockNumber, getBlock, getTransactionReceipt } from './eth/requests';
import { RawBlockResponse, RawLogResponse, RawTransactionResponse } from './eth/responses';
import { formatBlock, formatLogEvent, formatTransaction } from './format';
import { Address, AddressInfo, FormattedBlock, LogEventMessage } from './msgs';
import { Output, OutputMessage } from './output';
import { ABORT, AbortManager } from './utils/abort';
import { parallel, sleep } from './utils/async';
import { Cache, cached, NoopCache } from './utils/cache';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';

const { debug, info, warn, error, trace } = createModuleDebug('block');

export type StartBlock = 'latest' | 'genesis' | number;

const toAddressInfo = (contractInfo?: ContractInfo): AddressInfo | undefined =>
    contractInfo
        ? {
              contractName: contractInfo.contractName,
              isContract: contractInfo.isContract,
          }
        : undefined;

const initialCounters = {
    blocksProcessed: 0,
    transactionsProcessed: 0,
    transactionLogEventsProcessed: 0,
};

export function parseBlockTime(timestamp: number | string): number {
    if (typeof timestamp === 'number') {
        return timestamp * 1000;
    }
    // TODO: handle quorum/raft timestamps
    throw new Error(`Unable to parse block timestamp "${timestamp}"`);
}

export class BlockWatcher implements ManagedResource {
    private active: boolean = true;
    private ethClient: EthereumClient;
    private checkpoints: BlockRangeCheckpoint;
    private output: Output;
    private abiDecoder?: AbiDecoder;
    private startAt: StartBlock;
    private chunkSize: number = 25;
    private pollInterval: number = 500;
    private abortManager = new AbortManager();
    private endCallbacks: Array<() => void> = [];
    private contractInfoCache: Cache<string, Promise<ContractInfo>> = new NoopCache();
    private counters = { ...initialCounters };

    constructor({
        ethClient,
        checkpoints,
        output,
        abiDecoder,
        startAt = 'latest',
        contractInfoCache,
    }: {
        ethClient: EthereumClient;
        checkpoints: BlockRangeCheckpoint;
        output: Output;
        abiDecoder?: AbiDecoder;
        startAt?: StartBlock;
        contractInfoCache?: Cache<string, Promise<ContractInfo>>;
    }) {
        this.ethClient = ethClient;
        this.checkpoints = checkpoints;
        this.output = output;
        this.abiDecoder = abiDecoder;
        this.startAt = startAt;
        if (contractInfoCache) {
            this.contractInfoCache = contractInfoCache;
        }
    }

    async start(): Promise<void> {
        debug('Starting block watcher');
        const { ethClient, checkpoints } = this;

        if (checkpoints.isEmpty()) {
            if (typeof this.startAt === 'number') {
                if (this.startAt < 0) {
                    const latestBlockNumber = await ethClient.request(blockNumber());
                    checkpoints.initialBlockNumber = Math.max(0, latestBlockNumber - this.startAt);
                } else {
                    checkpoints.initialBlockNumber = this.startAt;
                }
            } else if (this.startAt === 'genesis') {
                checkpoints.initialBlockNumber = 0;
            } else if (this.startAt === 'latest') {
                const latestBlockNumber = await ethClient.request(blockNumber());
                checkpoints.initialBlockNumber = latestBlockNumber;
            }
            debug(
                'Determined initial block number: %d from configured value %o',
                checkpoints.initialBlockNumber,
                this.startAt
            );
        }

        while (this.active) {
            try {
                const latestBlockNumber = await ethClient.request(blockNumber());
                info('Received latest block number: %d', latestBlockNumber);
                const todo = checkpoints.getIncompleteRanges(latestBlockNumber);
                debug(
                    'Found %d block ranges (total of %d blocks) to process',
                    todo.length,
                    todo.map(blockRangeSize).reduce((a, b) => a + b, 0)
                );

                for (const range of todo) {
                    if (!this.active) {
                        throw ABORT;
                    }
                    await parallel(
                        chunkedBlockRanges(range, this.chunkSize).map(chunk => async () => {
                            if (!this.active) {
                                return;
                            }
                            await this.processChunk(chunk);
                        }),
                        { maxConcurrent: 3, abortManager: this.abortManager }
                    );
                }
            } catch (e) {
                error('Error in block watcher polling loop', e);
            }
            if (this.active) {
                await sleep(this.pollInterval);
            }
        }
        if (this.endCallbacks != null) {
            this.endCallbacks.forEach(cb => cb());
        }
        info('Block watcher stopped');
    }

    private async processChunk(chunk: BlockRange) {
        const startTime = Date.now();
        info('Processing chunk %o', chunk);

        debug('Requesting block range', chunk);
        const blockRequestStart = Date.now();
        const blocks = await this.ethClient.requestBatch(
            blockRangeToArray(chunk).map(blockNumber => getBlock(blockNumber))
        );
        info('Received %d blocks in %d ms', blocks.length, Date.now() - blockRequestStart);
        for (const block of blocks) {
            await this.processBlock(block);
        }
        info('Completed chunk %o (%d blocks) in %d ms', chunk, blocks.length, Date.now() - startTime);
    }

    private async processBlock(block: RawBlockResponse) {
        const outputMessages: OutputMessage[] = [];
        const formattedBlock = formatBlock(block);
        if (formattedBlock.number == null) {
            debug('Ignoring block %s without number', block.hash);
            return;
        }
        const blockTime = parseBlockTime(formattedBlock.timestamp);
        outputMessages.push({
            type: 'block',
            time: blockTime,
            block: formattedBlock,
        });
        const txMsgs = await this.abortManager.race(
            Promise.all(block.transactions.map(tx => this.processTransaction(tx, blockTime, formattedBlock)))
        );
        if (!this.active) {
            return;
        }
        outputMessages.forEach(msg => this.output.write(msg));
        txMsgs.forEach(msgs => msgs.forEach(msg => this.output.write(msg)));
        this.checkpoints.markBlockComplete(formattedBlock.number);
        this.counters.blocksProcessed++;
    }

    private async processTransaction(
        rawTx: RawTransactionResponse | string,
        blockTime: number,
        formattedBlock: FormattedBlock
    ): Promise<OutputMessage[]> {
        if (!this.active) {
            return [];
        }
        if (typeof rawTx === 'string') {
            warn('Received raw transaction as string from block %d', formattedBlock.number);
            return [];
        }
        const startTime = Date.now();
        trace('Processing transaction %s from block %d', rawTx.hash, formattedBlock.number);

        const [receipt, toInfo, fromInfo] = await Promise.all([
            this.ethClient.request(getTransactionReceipt(rawTx.hash)),
            rawTx.to != null ? this.lookupContractInfo(rawTx.to) : undefined,
            rawTx.from != null ? this.lookupContractInfo(rawTx.from) : undefined,
        ]);

        let contractAddresInfo: ContractInfo | undefined;
        if (receipt?.contractAddress != null) {
            contractAddresInfo = await this.lookupContractInfo(receipt.contractAddress);
        }

        let callInfo;
        if (this.abiDecoder && toInfo && toInfo.isContract) {
            callInfo = this.abiDecoder.decodeMethod(rawTx.input, toInfo.fingerprint);
        }

        trace('Completed processing transaction %s in %d ms', rawTx.hash, Date.now() - startTime);
        this.counters.transactionsProcessed++;
        return [
            {
                type: 'transaction',
                time: blockTime,
                tx: formatTransaction(
                    rawTx,
                    receipt!,
                    toAddressInfo(fromInfo),
                    toAddressInfo(toInfo),
                    toAddressInfo(contractAddresInfo),
                    callInfo
                ),
            },
            ...(await Promise.all(receipt?.logs?.map(l => this.processTransactionLog(l, blockTime)) || [])),
        ];
    }

    private async processTransactionLog(evt: RawLogResponse, blockTime: number): Promise<LogEventMessage> {
        const contractInfo = await this.lookupContractInfo(evt.address);
        const decodedEventData = this.abiDecoder?.decodeLogEvent(evt, contractInfo?.fingerprint);
        this.counters.transactionLogEventsProcessed++;
        return {
            type: 'event',
            time: blockTime,
            event: formatLogEvent(evt, toAddressInfo(contractInfo), decodedEventData),
        };
    }

    private async lookupContractInfo(address: Address): Promise<ContractInfo | undefined> {
        const abiDecoder = this.abiDecoder;
        if (abiDecoder == null) {
            return;
        }
        const result = await cached(address, this.contractInfoCache, (addr: Address) =>
            getContractInfo(
                addr,
                this.ethClient,
                (sig: string) => abiDecoder.getMatchingSignatureName(sig),
                (_address: string, fingerprint: string) =>
                    abiDecoder.getContractByFingerprint(fingerprint)?.contractName
            )
        );
        return result;
    }

    public async shutdown() {
        info('Shutting down block watcher');
        this.active = false;
        this.abortManager.abort();
        await new Promise<void>(resolve => {
            this.endCallbacks.push(resolve);
        });
    }

    public flushStats() {
        const counters = this.counters;
        this.counters = { ...initialCounters };
        return { ...counters, abortHandles: this.abortManager.size };
    }
}
