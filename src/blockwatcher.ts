import { ContractInfo, getContractInfo } from './abi/contract';
import { AbiRepository } from './abi/repo';
import { BlockRange, blockRangeSize, blockRangeToArray, chunkedBlockRanges, serializeBlockRange } from './blockrange';
import { Checkpoint } from './checkpoint';
import { EthereumClient } from './eth/client';
import { blockNumber, getBlock, getTransactionReceipt } from './eth/requests';
import { RawBlockResponse, RawLogResponse, RawTransactionResponse } from './eth/responses';
import { formatBlock, formatLogEvent, formatTransaction } from './format';
import { Address, AddressInfo, FormattedBlock, LogEventMessage } from './msgs';
import { Output, OutputMessage } from './output';
import { ABORT, AbortHandle } from './utils/abort';
import { parallel, sleep } from './utils/async';
import { bigIntToNumber } from './utils/bn';
import { Cache, cachedAsync, NoopCache } from './utils/cache';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';
import { linearBackoff, resolveWaitTime, retry, WaitTime } from './utils/retry';
import { AggregateMetric } from './utils/stats';

const { debug, info, warn, error, trace } = createModuleDebug('blockwatcher');

export type StartBlock = 'latest' | 'genesis' | number;

const toAddressInfo = (contractInfo?: ContractInfo): AddressInfo | undefined =>
    contractInfo
        ? {
              contractName: contractInfo.contractName,
              isContract: contractInfo.isContract,
          }
        : undefined;

export function parseBlockTime(timestamp: number | string): number {
    if (typeof timestamp === 'number') {
        return timestamp * 1000;
    }

    if (typeof timestamp === 'string') {
        // Timestamp on Quorum/Raft nodes are emitted as nanoseconds since unix epoch
        // so translate it to milliseconds
        const ms = BigInt(timestamp) / BigInt(1_000_000);
        return bigIntToNumber(ms);
    }
    throw new Error(`Unable to parse block timestamp "${timestamp}"`);
}

const initialCounters = {
    blocksProcessed: 0,
    transactionsProcessed: 0,
    transactionLogEventsProcessed: 0,
};

/**
 * BlockWatcher will query all blocks, transactions, receipts and logs from an ethereum node,
 * compute some additional information, such as address information and decoded ABI data and
 * will send them to the output. It uses checkpoints to keep track of state and will resume
 * where it left off when restarted.
 */
export class BlockWatcher implements ManagedResource {
    private active: boolean = true;
    private ethClient: EthereumClient;
    private checkpoints: Checkpoint;
    private output: Output;
    private abiRepo?: AbiRepository;
    private startAt: StartBlock;
    private chunkSize: number = 25;
    private maxParallelChunks: number = 3;
    private pollInterval: number = 500;
    private abortHandle = new AbortHandle();
    private endCallbacks: Array<() => void> = [];
    private waitAfterFailure: WaitTime;
    private chunkQueueMaxSize: number;
    private contractInfoCache: Cache<string, Promise<ContractInfo>> = new NoopCache();
    private counters = { ...initialCounters };
    private aggregates = {
        blockProcessTime: new AggregateMetric(),
        txProcessTime: new AggregateMetric(),
        eventProcessTime: new AggregateMetric(),
    };

    constructor({
        ethClient,
        checkpoints,
        output,
        abiRepo,
        startAt = 'genesis',
        contractInfoCache,
        waitAfterFailure = linearBackoff({ min: 0, step: 2500, max: 120_000 }),
        chunkQueueMaxSize = 1000,
        chunkSize = 25,
        maxParallelChunks = 3,
        pollInterval = 500,
    }: {
        ethClient: EthereumClient;
        checkpoints: Checkpoint;
        output: Output;
        abiRepo: AbiRepository;
        startAt: StartBlock;
        waitAfterFailure?: WaitTime;
        chunkQueueMaxSize?: number;
        contractInfoCache?: Cache<string, Promise<ContractInfo>>;
        chunkSize: number;
        maxParallelChunks: number;
        pollInterval: number;
    }) {
        this.ethClient = ethClient;
        this.checkpoints = checkpoints;
        this.output = output;
        this.abiRepo = abiRepo;
        this.startAt = startAt;
        this.waitAfterFailure = waitAfterFailure;
        this.chunkSize = chunkSize;
        this.maxParallelChunks = maxParallelChunks;
        this.pollInterval = pollInterval;
        this.chunkQueueMaxSize = chunkQueueMaxSize;
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
                    checkpoints.initialBlockNumber = Math.max(0, latestBlockNumber + this.startAt);
                } else {
                    checkpoints.initialBlockNumber = this.startAt;
                }
            } else if (this.startAt === 'genesis') {
                checkpoints.initialBlockNumber = 0;
            } else if (this.startAt === 'latest') {
                const latestBlockNumber = await ethClient.request(blockNumber());
                checkpoints.initialBlockNumber = latestBlockNumber;
            } else {
                throw new Error(`Invalid start block: ${JSON.stringify(this.startAt)}`);
            }
            info(
                'Determined initial block number: %d from configured value %o',
                checkpoints.initialBlockNumber,
                this.startAt
            );
        }

        let failures = 0;
        while (this.active) {
            try {
                const latestBlockNumber = await ethClient.request(blockNumber());
                debug('Received latest block number: %d', latestBlockNumber);
                const todo = checkpoints.getIncompleteRanges(latestBlockNumber);
                debug('Found %d block ranges to process', todo.length);
                if (todo.length) {
                    info(
                        'Latest block number is %d - processing remaining %d blocks',
                        latestBlockNumber,
                        todo.map(blockRangeSize).reduce((a, b) => a + b, 0)
                    );
                }

                for (const range of todo) {
                    if (!this.active) {
                        throw ABORT;
                    }
                    await parallel(
                        chunkedBlockRanges(range, this.chunkSize, this.chunkQueueMaxSize).map(chunk => async () => {
                            if (!this.active) {
                                return;
                            }
                            await retry(() => this.processChunk(chunk), {
                                attempts: 100,
                                waitBetween: this.waitAfterFailure,
                                taskName: `block range ${serializeBlockRange(chunk)}`,
                                abortHandle: this.abortHandle,
                                warnOnError: true,
                                onRetry: attempt =>
                                    warn(
                                        'Retrying to process block range %s (attempt %d)',
                                        serializeBlockRange(chunk),
                                        attempt
                                    ),
                            });
                        }),
                        { maxConcurrent: this.maxParallelChunks, abortHandle: this.abortHandle }
                    );
                    failures = 0;
                }
            } catch (e) {
                if (e === ABORT) {
                    break;
                }
                error('Error in block watcher polling loop', e);
                failures++;
                const waitTime = resolveWaitTime(this.waitAfterFailure, failures);
                if (waitTime > 0) {
                    warn('Waiting for %d ms after %d consecutive failures', waitTime, failures);
                    await this.abortHandle.race(sleep(waitTime));
                }
            }
            if (this.active) {
                try {
                    await this.abortHandle.race(sleep(this.pollInterval));
                } catch (e) {
                    if (e === ABORT) {
                        break;
                    } else {
                        warn('Unexpected error while waiting for next polling loop iteration', e);
                    }
                }
            }
        }
        if (this.endCallbacks != null) {
            this.endCallbacks.forEach(cb => cb());
        }
        info('Block watcher stopped');
    }

    async processChunk(chunk: BlockRange) {
        const startTime = Date.now();
        info('Processing chunk %s', serializeBlockRange(chunk));

        debug('Requesting block range', chunk);
        const blockRequestStart = Date.now();
        const blocks = await this.ethClient
            .requestBatch(
                blockRangeToArray(chunk)
                    .filter(blockNumber => this.checkpoints.isIncomplete(blockNumber))
                    .map(blockNumber => getBlock(blockNumber))
            )
            .catch(e =>
                Promise.reject(new Error(`Failed to request batch of blocks ${serializeBlockRange(chunk)}: ${e}`))
            );
        debug('Received %d blocks in %d ms', blocks.length, Date.now() - blockRequestStart);
        for (const block of blocks) {
            await this.processBlock(block);
        }
        info(
            'Completed %d blocks of chunk %s in %d ms',
            blocks.length,
            serializeBlockRange(chunk),
            Date.now() - startTime
        );
    }

    private async processBlock(block: RawBlockResponse) {
        if (block.number != null && !this.checkpoints.isIncomplete(bigIntToNumber(block.number))) {
            warn('Skipping processing of block %d since it is marked complete in our checkpoint');
            return;
        }
        const startTime = Date.now();
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
            body: formattedBlock,
        });
        const txMsgs = await this.abortHandle.race(
            Promise.all(block.transactions.map(tx => this.processTransaction(tx, blockTime, formattedBlock)))
        );
        if (!this.active) {
            return;
        }
        outputMessages.forEach(msg => this.output.write(msg));
        txMsgs.forEach(msgs => msgs.forEach(msg => this.output.write(msg)));
        this.checkpoints.markBlockComplete(formattedBlock.number);
        this.counters.blocksProcessed++;
        this.aggregates.blockProcessTime.push(Date.now() - startTime);
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
        if (this.abiRepo && toInfo && toInfo.isContract) {
            callInfo = this.abiRepo.decodeFunctionCall(rawTx.input, {
                contractAddress: rawTx.to ?? undefined,
                contractFingerprint: toInfo.fingerprint,
            });
        }

        this.counters.transactionsProcessed++;
        this.aggregates.txProcessTime.push(Date.now() - startTime);
        trace('Completed processing transaction %s in %d ms', rawTx.hash, Date.now() - startTime);
        return [
            {
                type: 'transaction',
                time: blockTime,
                body: formatTransaction(
                    rawTx,
                    receipt!,
                    toAddressInfo(fromInfo),
                    toAddressInfo(toInfo),
                    toAddressInfo(contractAddresInfo),
                    callInfo
                ),
            },
            ...(await Promise.all(receipt?.logs?.map(l => this.processTransactionLog(l, blockTime)) ?? [])),
        ];
    }

    private async processTransactionLog(evt: RawLogResponse, blockTime: number): Promise<LogEventMessage> {
        const startTime = Date.now();
        const contractInfo = await this.lookupContractInfo(evt.address);
        const decodedEventData = this.abiRepo?.decodeLogEvent(evt, {
            contractAddress: evt.address,
            contractFingerprint: contractInfo?.fingerprint,
        });
        this.aggregates.eventProcessTime.push(Date.now() - startTime);
        this.counters.transactionLogEventsProcessed++;
        return {
            type: 'event',
            time: blockTime,
            body: formatLogEvent(evt, toAddressInfo(contractInfo), decodedEventData),
        };
    }

    private async lookupContractInfo(address: Address): Promise<ContractInfo | undefined> {
        const abiRepo = this.abiRepo;
        if (abiRepo == null) {
            return;
        }
        const result = await cachedAsync(address, this.contractInfoCache, (addr: Address) =>
            getContractInfo(
                addr,
                this.ethClient,
                (sig: string) => abiRepo.getMatchingSignatureName(sig),
                (address: string, fingerprint: string) =>
                    abiRepo.getContractByAddress(address)?.contractName ??
                    abiRepo.getContractByFingerprint(fingerprint)?.contractName
            )
        );
        return result;
    }

    public async shutdown() {
        info('Shutting down block watcher');
        this.active = false;
        this.abortHandle.abort();
        await new Promise<void>(resolve => {
            this.endCallbacks.push(resolve);
        });
    }

    public flushStats() {
        const stats = {
            ...this.counters,
            ...this.aggregates.blockProcessTime.flush('blockProcessTime'),
            ...this.aggregates.txProcessTime.flush('txProcessTime'),
            ...this.aggregates.eventProcessTime.flush('eventProcessTime'),
            abortHandles: this.abortHandle.size,
        };
        this.counters = { ...initialCounters };
        return stats;
    }
}
