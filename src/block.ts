import AbortController from 'abort-controller';
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
import { parallel, sleep } from './utils/async';
import { Cache, cached, NoopCache } from './utils/cache';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';

const { debug, info, warn, error } = createModuleDebug('block');

export type StartBlock = 'latest' | 'genesis' | number;

const toAddressInfo = (contractInfo?: ContractInfo): AddressInfo | undefined =>
    contractInfo
        ? {
              contractName: contractInfo.contractName,
              isContract: contractInfo.isContract,
          }
        : undefined;

export class BlockWatcher implements ManagedResource {
    private active: boolean = true;
    private ethClient: EthereumClient;
    private checkpoints: BlockRangeCheckpoint;
    private output: Output;
    private abiDecoder?: AbiDecoder;
    private startAt: StartBlock;
    private chunkSize: number = 250;
    private pollInterval: number = 500;
    private abortController: AbortController;
    private endCallbacks: Array<() => void> = [];
    private contractInfoCache: Cache<string, Promise<ContractInfo>> = new NoopCache();

    constructor({
        ethClient,
        checkpoints,
        output,
        abiDecoder,
        startAt = 'latest',
    }: {
        ethClient: EthereumClient;
        checkpoints: BlockRangeCheckpoint;
        output: Output;
        abiDecoder?: AbiDecoder;
        startAt?: StartBlock;
    }) {
        this.ethClient = ethClient;
        this.checkpoints = checkpoints;
        this.output = output;
        this.abiDecoder = abiDecoder;
        this.startAt = startAt;
        this.abortController = new AbortController();
    }

    async start(): Promise<void> {
        debug('Starting block watcher');
        const { ethClient, checkpoints } = this;

        if (checkpoints.isEmpty()) {
            if (typeof this.startAt === 'number') {
                checkpoints.initialBlockNumber = this.startAt;
            } else if (this.startAt === 'genesis') {
                checkpoints.initialBlockNumber = 0;
            } else if (this.startAt === 'latest') {
                const latestBlockNumber = await ethClient.request(blockNumber());
                checkpoints.initialBlockNumber = latestBlockNumber;
            }
            debug('Determined initial block number: %d', checkpoints.initialBlockNumber);
        }

        while (this.active) {
            try {
                const latestBlockNumber = await ethClient.request(blockNumber());
                debug('Received latest block number: %d', latestBlockNumber);
                const todo = checkpoints.getIncompleteRanges(latestBlockNumber);
                debug(
                    'Found %d block ranges (total of %d blocks) to process',
                    todo.length,
                    todo.map(blockRangeSize).reduce((a, b) => a + b, 0)
                );

                for (const range of todo) {
                    for (const chunk of chunkedBlockRanges(range, this.chunkSize)) {
                        if (!this.active) {
                            break;
                        }
                        await this.processChunk(chunk);
                    }
                }
            } catch (e) {
                error('Error in block watcher polling loop', e);
            }
            await sleep(this.pollInterval);
        }
        if (this.endCallbacks != null) {
            this.endCallbacks.forEach(cb => cb());
        }
        debug('Block watcher stopped');
    }

    private async processChunk(chunk: BlockRange) {
        const startTime = Date.now();
        info('Processing chunk %o', chunk);

        debug('Requesting block range', chunk);
        const blockRequestStart = Date.now();
        const blocks = await this.ethClient.requestBatch(
            blockRangeToArray(chunk).map(blockNumber => getBlock(blockNumber))
        );
        debug('Received %d blocks in %d ms', blocks.length, Date.now() - blockRequestStart);
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
        const blockTime = formattedBlock.timestamp * 1000;
        outputMessages.push({
            type: 'block',
            time: blockTime,
            block: formattedBlock,
        });

        const txMsgs = await parallel(
            block.transactions.map(tx => () => this.processTransaction(tx, blockTime, formattedBlock)),
            { maxConcurrent: 25, abortSignal: this.abortController.signal }
        );

        outputMessages.forEach(msg => this.output.write(msg));
        txMsgs.forEach(msgs => msgs.forEach(msg => this.output.write(msg)));
        this.checkpoints.markBlockComplete(formattedBlock.number);
    }

    private async processTransaction(
        rawTx: RawTransactionResponse | string,
        blockTime: number,
        formattedBlock: FormattedBlock
    ): Promise<OutputMessage[]> {
        if (typeof rawTx === 'string') {
            warn('Received raw transaction as string from block %d', formattedBlock.number);
            return [];
        }

        const [receipt, toInfo, fromInfo] = await Promise.all([
            this.ethClient.request(getTransactionReceipt(rawTx.hash)),
            rawTx.to != null ? this.lookupContractInfo(rawTx.to) : undefined,
            rawTx.from != null ? this.lookupContractInfo(rawTx.from) : undefined,
        ]);

        let callInfo;
        if (this.abiDecoder && toInfo && toInfo.isContract) {
            callInfo = this.abiDecoder.decodeMethod(rawTx.input, toInfo.fingerprint);
        }

        return [
            {
                type: 'transaction',
                time: blockTime,
                tx: formatTransaction(rawTx, receipt!, toAddressInfo(fromInfo), toAddressInfo(toInfo), callInfo),
            },
            ...(await Promise.all(receipt?.logs?.map(l => this.processTransactionLog(l, blockTime)) || [])),
        ];
    }

    private async processTransactionLog(evt: RawLogResponse, blockTime: number): Promise<LogEventMessage> {
        const contractInfo = await this.lookupContractInfo(evt.address);
        const decodedEventData = this.abiDecoder?.decodeLogEvent(evt, contractInfo?.fingerprint);
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
        debug('Shutting down block watcher');
        this.active = false;
        this.abortController.abort();
        await new Promise<void>(resolve => {
            this.endCallbacks.push(resolve);
        });
    }
}
