import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';
import { EthereumClient } from './eth/client';
import { Output, OutputMessage } from './output';
import { ContractTracerConfig } from './config';
import { NodePlatformAdapter } from './platforms';
import { ABORT, AbortHandle } from './utils/abort';
import { linearBackoff, resolveWaitTime, retry, WaitTime } from './utils/retry';
import { Cache } from './utils/cache';
import { ContractInfo } from './abi/contract';
import { AggregateMetric } from './utils/stats';
import { blockNumber, getBlock, getTransactionReceipt, gethTraceTransaction } from './eth/requests';
import { BlockRange, blockRangeSize, blockRangeToArray, chunkedBlockRanges, serializeBlockRange } from './blockrange';
import { parallel, sleep } from './utils/async';
import { RawBlockResponse, RawTransactionResponse } from './eth/responses';
import { bigIntToNumber } from './utils/bn';
import { formatBlock } from './format';
import { parseBlockTime } from './blockwatcher';
import { FormattedBlock, TraceTransactionMessage } from './msgs';
import { Checkpoint } from './state';

const { debug, info, warn, error, trace } = createModuleDebug('ContractTracer');

const initialCounters = {
    blocksProcessed: 0,
    tracesProcessed: 0,
};

/**
 * ContractTracer will watch the activity of a contract on chain, tracing transactions with events emitted by the contract.
 */
export class ContractTracer implements ManagedResource {
    private active: boolean = true;
    private ethClient: EthereumClient;
    private checkpoint: Checkpoint;
    private output: Output;
    private config: ContractTracerConfig;
    private addresses: Set<string>;
    private nodePlatform: NodePlatformAdapter;
    private abortHandle = new AbortHandle();
    private endCallbacks: Array<() => void> = [];
    private waitAfterFailure: WaitTime;
    private chunkQueueMaxSize: number;
    private counters = { ...initialCounters };
    private aggregates = {
        blockProcessTime: new AggregateMetric(),
        txProcessTime: new AggregateMetric(),
        eventProcessTime: new AggregateMetric(),
    };

    constructor({
        ethClient,
        checkpoint,
        output,
        config,
        waitAfterFailure = linearBackoff({ min: 0, step: 2500, max: 120_000 }),
        chunkQueueMaxSize = 1000,
        nodePlatform,
    }: {
        ethClient: EthereumClient;
        output: Output;
        checkpoint: Checkpoint;
        config: ContractTracerConfig;
        waitAfterFailure?: WaitTime;
        chunkQueueMaxSize?: number;
        contractInfoCache?: Cache<string, Promise<ContractInfo>>;
        nodePlatform: NodePlatformAdapter;
    }) {
        this.ethClient = ethClient;
        this.checkpoint = checkpoint;
        this.output = output;
        this.config = config;
        this.waitAfterFailure = waitAfterFailure;
        this.chunkQueueMaxSize = chunkQueueMaxSize;
        this.nodePlatform = nodePlatform;
        this.addresses = new Set(this.config.contractAddresses.map(address => address.toLowerCase()));
    }

    async start(): Promise<void> {
        debug('Starting contract tracer for %s', this.checkpoint.getID());
        const { ethClient, checkpoint } = this;

        if (checkpoint.isEmpty()) {
            if (typeof this.config.startAt === 'number') {
                if (this.config.startAt < 0) {
                    const latestBlockNumber = await ethClient.request(blockNumber());
                    checkpoint.setInitialBlockNumber(Math.max(0, latestBlockNumber + this.config.startAt));
                } else {
                    checkpoint.setInitialBlockNumber(this.config.startAt);
                }
            } else if (this.config.startAt === 'genesis') {
                checkpoint.setInitialBlockNumber(0);
            } else if (this.config.startAt === 'latest') {
                const latestBlockNumber = await ethClient.request(blockNumber());
                checkpoint.setInitialBlockNumber(latestBlockNumber);
            } else {
                throw new Error(`Invalid start block: ${JSON.stringify(this.config.startAt)}`);
            }
            info(
                'Determined initial block number: %d from configured value %o',
                checkpoint.getinitialBlockNumber(),
                this.config.startAt
            );
        }

        let failures = 0;
        while (this.active) {
            try {
                let latestBlockNumber = await ethClient.request(blockNumber());
                debug('Received latest block number: %d', latestBlockNumber);
                const reachedEnd = this.config.endAt !== undefined && latestBlockNumber > this.config.endAt;
                if (reachedEnd) {
                    latestBlockNumber = this.config.endAt as number;
                    debug('Processing up to end of range %d', latestBlockNumber);
                }
                const todo = checkpoint.getIncompleteRanges(latestBlockNumber);
                debug('Found %d block ranges to process', todo.length);
                if (todo.length) {
                    info(
                        'Latest block number is %d - processing remaining %d blocks',
                        latestBlockNumber,
                        todo.map(blockRangeSize).reduce((a, b) => a + b, 0)
                    );
                }
                if (reachedEnd && todo.length == 0) {
                    info('Completed collecting blocks from %o to %d', this.config.startAt, this.config.endAt);
                    this.active = false;
                }

                for (const range of todo) {
                    if (!this.active) {
                        throw ABORT;
                    }
                    await parallel(
                        chunkedBlockRanges(range, this.config.blocksMaxChunkSize, this.chunkQueueMaxSize).map(
                            chunk => async () => {
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
                            }
                        ),
                        { maxConcurrent: this.config.maxParallelChunks, abortHandle: this.abortHandle }
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
                    await this.abortHandle.race(sleep(this.config.pollInterval));
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
        info('contract tracer stopped for %s', this.checkpoint.getID());
    }

    async processChunk(chunk: BlockRange) {
        const startTime = Date.now();
        info('Processing chunk %s', serializeBlockRange(chunk));

        debug('Requesting block range', chunk);
        const blockRequestStart = Date.now();
        const blocks = await this.ethClient
            .requestBatch(
                blockRangeToArray(chunk)
                    .filter(blockNumber => this.checkpoint.isIncomplete(blockNumber))
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

    async processBlock(block: RawBlockResponse) {
        if (block.number != null && !this.checkpoint.isIncomplete(bigIntToNumber(block.number))) {
            warn('Skipping processing of block %d since it is marked complete in our checkpoint');
            return;
        }
        const startTime = Date.now();
        const formattedBlock = formatBlock(block);
        if (formattedBlock.number == null) {
            debug('Ignoring block %s without number', block.hash);
            return;
        }
        const blockTime = parseBlockTime(formattedBlock.timestamp);

        if (!this.active) {
            return;
        }
        const outputMessages = await this.abortHandle.race(
            Promise.all(block.transactions.map(tx => this.processTransaction(tx, blockTime, formattedBlock)))
        );
        outputMessages.forEach(msgs => msgs.forEach(msg => this.output.write(msg)));
        this.checkpoint.markBlockComplete(formattedBlock.number);
        this.counters.blocksProcessed++;
        this.aggregates.blockProcessTime.push(Date.now() - startTime);
    }

    public async shutdown() {
        info('Shutting down contract tracer for %s', this.checkpoint.getID());
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

    async processTransaction(
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

        const receipt = await this.ethClient.request(getTransactionReceipt(rawTx.hash));
        const outputMessages = Array<OutputMessage>();
        if (receipt != null && receipt.logs != null) {
            const matchedAddrs = [
                ...new Set(
                    receipt.logs
                        .map(log => log.address.toLowerCase())
                        .filter(addr => this.addresses.has(addr.toLowerCase()))
                ),
            ];

            if (matchedAddrs.length > 0) {
                this.counters.tracesProcessed++;
                const gethTraceTransactionResponse = await this.abortHandle.race(
                    this.ethClient.request(gethTraceTransaction(rawTx.hash), { immediate: true })
                );

                const outputMessage: TraceTransactionMessage = {
                    type: 'traceTransaction',
                    time: blockTime,
                    body: {
                        watcher: this.checkpoint.getID(),
                        contracts: matchedAddrs,
                        transactionHash: rawTx.hash,
                        blockHash: formattedBlock.hash!,
                        blockNumber: formattedBlock.number!,
                        ...gethTraceTransactionResponse,
                    },
                };
                outputMessages.push(outputMessage);
            }
        }

        this.aggregates.txProcessTime.push(Date.now() - startTime);
        trace('Completed processing transaction %s in %d ms', rawTx.hash, Date.now() - startTime);
        return outputMessages;
    }
}
