import { createModuleDebug } from './utils/debug';
import { sha3 } from './abi/wasm';
import { ManagedResource } from './utils/resource';
import { EthereumClient } from './eth/client';
import { Checkpoint } from './state';
import { Output, OutputMessage } from './output';
import { NFTWatcherConfig } from './config';
import { NodePlatformAdapter } from './platforms';
import { ABORT, AbortHandle } from './utils/abort';
import { linearBackoff, resolveWaitTime, retry, WaitTime } from './utils/retry';
import { AggregateMetric } from './utils/stats';
import { Cache } from './utils/cache';
import { ContractInfo } from './abi/contract';
import { blockNumber, ethCall, getBlock, getTransactionReceipt } from './eth/requests';
import { BlockRange, blockRangeSize, blockRangeToArray, chunkedBlockRanges, serializeBlockRange } from './blockrange';
import { parallel, sleep } from './utils/async';
import { RawBlockResponse, RawTransactionResponse } from './eth/responses';
import { bigIntToNumber } from './utils/bn';
import { formatBlock } from './format';
import { parseBlockTime } from './blockwatcher';
import { FormattedBlock, NftMessage } from './msgs';
import { ethers } from 'ethers';
import fetch from 'node-fetch';

const abiDecoder = new ethers.utils.AbiCoder();
const maxResponseSize = 4096;

const { debug, info, warn, error, trace } = createModuleDebug('nftwatcher');

const transferEventSignature = sha3('Transfer(address,address,uint256)')!;

const initialCounters = {
    blocksProcessed: 0,
    mintsProcessed: 0,
    transfersProcessed: 0,
};

interface NftTransfer {
    from: string;
    to: string;
    tokenIndex: string;
}

/**
 * NFTWatcher will watch the activity of a NFT contract on chain, keep track of all accounts transferring tokens and log NFT metadata.
 */
export class NFTWatcher implements ManagedResource {
    private active: boolean = true;
    private collectRetrievalTime: boolean;
    private ethClient: EthereumClient;
    private checkpoint: Checkpoint;
    private output: Output;
    private config: NFTWatcherConfig;
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
        collectRetrievalTime = true,
    }: {
        ethClient: EthereumClient;
        output: Output;
        checkpoint: Checkpoint;
        config: NFTWatcherConfig;
        waitAfterFailure?: WaitTime;
        chunkQueueMaxSize?: number;
        contractInfoCache?: Cache<string, Promise<ContractInfo>>;
        nodePlatform: NodePlatformAdapter;
        collectRetrievalTime?: boolean;
    }) {
        this.ethClient = ethClient;
        this.checkpoint = checkpoint;
        this.output = output;
        this.config = config;
        this.waitAfterFailure = waitAfterFailure;
        this.chunkQueueMaxSize = chunkQueueMaxSize;
        this.nodePlatform = nodePlatform;
        this.collectRetrievalTime = collectRetrievalTime;
    }

    async start(): Promise<void> {
        debug('Starting nft watcher for %s', this.config.contractAddress);
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
        info('NFT watcher stopped');
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
        info('Shutting down NFT watcher for %s', this.config.contractAddress);
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

        let outputMessages = Array<OutputMessage>();
        if (receipt != null && receipt.logs != null) {
            const transfers = receipt.logs
                ?.map(log => {
                    if (log.topics[0] == transferEventSignature && log.topics.length == 4) {
                        const from = '0x' + log.topics[1].substr(26);
                        const to = '0x' + log.topics[2].substr(26);
                        const tokenIndex = log.topics[3];
                        return { from, to, tokenIndex };
                    }
                })
                .filter((x): x is NftTransfer => x !== null && x !== undefined);
            this.counters.transfersProcessed += transfers.length;
            outputMessages = await this.abortHandle.race(
                Promise.all(
                    transfers.map(t =>
                        this.complementWithTokenInfo(t.from, t.to, t.tokenIndex, formattedBlock, blockTime)
                    )
                )
            );
        }

        this.aggregates.txProcessTime.push(Date.now() - startTime);
        trace('Completed processing transaction %s in %d ms', rawTx.hash, Date.now() - startTime);
        return outputMessages;
    }

    async complementWithTokenInfo(
        from: string,
        to: string,
        index: string,
        formattedBlock: FormattedBlock,
        blockTime: number
    ): Promise<NftMessage> {
        const response = await this.ethClient.request(
            ethCall(this.config.contractAddress, 'tokenURI(uint256)', [index.substr(2)], formattedBlock.number!)
        );

        let decoded = '';
        let metadata: any = null;
        try {
            const decodeResults = abiDecoder.decode(['string'], response);
            if (decodeResults.length == 1) {
                decoded = decodeResults[0];
                metadata = await this.fetchMetadata(decoded);
            } else {
                warn('Expected a string object, received %o', decodeResults);
            }
        } catch (e) {
            warn(e);
        }
        return {
            body: {
                from: from,
                to: to,
                contract: this.config.contractAddress,
                blockHash: formattedBlock.hash!,
                blockNumber: formattedBlock.number!,
                index: index,
                rawTokenURI: response,
                tokenURI: decoded,
                metadata: metadata,
                retrievalTime: this.collectRetrievalTime ? Math.floor(Date.now() / 1000) : 0,
            },
            time: blockTime,
            type: 'nft',
        };
    }

    async fetchMetadata(tokenURI: string): Promise<any> {
        try {
            const url = new URL(tokenURI);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                debug('%s uses an unsupported protocol', tokenURI);
                return;
            }
        } catch (_) {
            debug('%s is not a supported url', tokenURI);
            return;
        }

        try {
            const metadataResponse = await fetch(tokenURI, { size: maxResponseSize });
            const isJson = metadataResponse.headers.get('content-type')?.includes('application/json');
            if (isJson) {
                return metadataResponse.json();
            } else {
                return metadataResponse.text();
            }
        } catch (e) {
            warn('Error reported while fetching from %s: %o', tokenURI, e);
        }
        return;
    }
}
