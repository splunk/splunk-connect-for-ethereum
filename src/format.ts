import { RawBlockResponse, RawTransactionResponse, RawTransactionReceipt, RawLogResponse } from './eth/responses';
import { FormattedBlock, FormattedTransaction, FormattedLogEvent, FunctionCall, AddressInfo, EventData } from './msgs';
import { hexToNumber, toChecksumAddress } from 'web3-utils';

export function formatBlock(rawBlock: RawBlockResponse): FormattedBlock {
    return {
        timestamp: hexToNumber(rawBlock.timestamp),
        number: rawBlock.number != null ? hexToNumber(rawBlock.number) : null,
        hash: rawBlock.hash,
        parentHash: rawBlock.parentHash,
        sha3Uncles: rawBlock.sha3Uncles,
        miner: toChecksumAddress(rawBlock.miner),
        stateRoot: rawBlock.stateRoot,
        transactionsRoot: rawBlock.transactionsRoot,
        receiptsRoot: rawBlock.receiptsRoot,
        logsBloom: rawBlock.logsBloom,
        difficulty: hexToNumber(rawBlock.difficulty),
        gasLimit: hexToNumber(rawBlock.gasLimit),
        gasUsed: hexToNumber(rawBlock.gasUsed),
        extraData: rawBlock.extraData,
        nonce: rawBlock.nonce,
        totalDifficulty: hexToNumber(rawBlock.totalDifficulty),
        size: hexToNumber(rawBlock.size),
        uncles: rawBlock.uncles,
        transactionCount: rawBlock.transactions == null ? 0 : rawBlock.transactions.length,
    };
}

function formatStatus(receiptStatus?: string): 'success' | 'failure' | null {
    if (receiptStatus != null) {
        const n = hexToNumber(receiptStatus);
        if (n === 0) {
            return 'failure';
        } else if (n === 1) {
            return 'success';
        } else {
            throw new Error(`Encountered invalid receipt status value: ${n} (expected 0 or 1)`);
        }
    }
    return null;
}

export function formatTransaction(
    rawTx: RawTransactionResponse,
    receipt: RawTransactionReceipt,
    fromInfo?: AddressInfo,
    toInfo?: AddressInfo,
    call?: FunctionCall
): FormattedTransaction {
    return {
        hash: rawTx.hash,
        blockNumber: rawTx.blockNumber != null ? hexToNumber(rawTx.blockNumber) : null,
        blockHash: rawTx.blockHash,
        from: toChecksumAddress(rawTx.from),
        to: rawTx.to != null ? toChecksumAddress(rawTx.to) : null,
        gas: hexToNumber(rawTx.gas),
        gasPrice: hexToNumber(rawTx.gasPrice),
        input: rawTx.input,
        nonce: rawTx.nonce,
        transactionIndex: rawTx.transactionIndex != null ? hexToNumber(rawTx.transactionIndex) : null,
        value: rawTx.value,
        v: rawTx.v,
        r: rawTx.r,
        s: rawTx.s,
        status: formatStatus(receipt.status),
        contractAddress: receipt.contractAddress != null ? toChecksumAddress(receipt.contractAddress) : null,
        cumulativeGasUsed: hexToNumber(receipt.cumulativeGasUsed),
        gasUsed: hexToNumber(receipt.gasUsed),
        fromInfo,
        toInfo,
        call,
    };
}

export function formatLogEvent(evt: RawLogResponse, addressInfo?: AddressInfo, event?: EventData): FormattedLogEvent {
    return {
        removed: evt.removed,
        logIndex: evt.logIndex != null ? hexToNumber(evt.logIndex) : null,
        blockNumber: evt.blockNumber != null ? hexToNumber(evt.blockNumber) : null,
        blockHash: evt.blockHash,
        transactionHash: evt.transactionHash,
        transactionIndex: evt.transactionIndex != null ? hexToNumber(evt.transactionIndex) : null,
        address: toChecksumAddress(evt.address),
        data: evt.data,
        topics: evt.topics,
        addressInfo,
        event,
    };
}
