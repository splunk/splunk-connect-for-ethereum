import { toChecksumAddress } from './abi/wasm';
import { RawBlockResponse, RawLogResponse, RawTransactionReceipt, RawTransactionResponse } from './eth/responses';
import {
    AddressInfo,
    BaseFormattedTransaction,
    EventData,
    FormattedBlock,
    FormattedLogEvent,
    FormattedPendingTransaction,
    FormattedTransaction,
    FunctionCall,
    PrivateTransactionPayload,
} from './msgs';
import { bigIntToNumber, parseBigInt } from './utils/bn';

export function formatBlock(rawBlock: RawBlockResponse): FormattedBlock {
    return {
        timestamp: parseBigInt(rawBlock.timestamp),
        number: rawBlock.number != null ? bigIntToNumber(rawBlock.number) : null,
        hash: rawBlock.hash,
        parentHash: rawBlock.parentHash,
        sha3Uncles: rawBlock.sha3Uncles,
        miner: toChecksumAddress(rawBlock.miner),
        stateRoot: rawBlock.stateRoot,
        transactionsRoot: rawBlock.transactionsRoot,
        receiptsRoot: rawBlock.receiptsRoot,
        logsBloom: rawBlock.logsBloom,
        difficulty: parseBigInt(rawBlock.difficulty),
        gasLimit: parseBigInt(rawBlock.gasLimit),
        gasUsed: parseBigInt(rawBlock.gasUsed),
        extraData: rawBlock.extraData,
        nonce: rawBlock.nonce,
        totalDifficulty: parseBigInt(rawBlock.totalDifficulty),
        size: bigIntToNumber(rawBlock.size),
        uncles: rawBlock.uncles,
        transactionCount: rawBlock.transactions == null ? 0 : rawBlock.transactions.length,
    };
}

function formatStatus(receiptStatus?: string): 'success' | 'failure' | null {
    if (receiptStatus != null) {
        const n = bigIntToNumber(receiptStatus);
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

function formatBaseTransaction(rawTx: RawTransactionResponse): BaseFormattedTransaction {
    return {
        hash: rawTx.hash,
        from: toChecksumAddress(rawTx.from),
        to: rawTx.to != null ? toChecksumAddress(rawTx.to) : null,
        gas: parseBigInt(rawTx.gas),
        gasPrice: parseBigInt(rawTx.gasPrice),
        input: rawTx.input,
        nonce: bigIntToNumber(rawTx.nonce),
        value: parseBigInt(rawTx.value),
        v: rawTx.v,
        r: rawTx.r,
        s: rawTx.s,
    };
}

export function formatTransaction(
    rawTx: RawTransactionResponse,
    receipt: RawTransactionReceipt,
    fromInfo?: AddressInfo,
    toInfo?: AddressInfo,
    contractAddressInfo?: AddressInfo,
    call?: FunctionCall,
    privatePayload?: PrivateTransactionPayload
): FormattedTransaction {
    return {
        ...formatBaseTransaction(rawTx),
        blockHash: rawTx.blockHash,
        blockNumber: rawTx.blockNumber != null ? bigIntToNumber(rawTx.blockNumber) : null,
        transactionIndex: rawTx.transactionIndex != null ? bigIntToNumber(rawTx.transactionIndex) : null,
        status: formatStatus(receipt.status),
        contractAddress: receipt.contractAddress != null ? toChecksumAddress(receipt.contractAddress) : null,
        cumulativeGasUsed: parseBigInt(receipt.cumulativeGasUsed),
        gasUsed: parseBigInt(receipt.gasUsed),
        fromInfo,
        toInfo,
        contractAddressInfo,
        call,
        privatePayload,
    };
}

export function formatPendingTransaction(
    rawTx: RawTransactionResponse,
    type: 'pending' | 'queued',
    fromInfo?: AddressInfo,
    toInfo?: AddressInfo,
    call?: FunctionCall
): FormattedPendingTransaction {
    return {
        type,
        ...formatBaseTransaction(rawTx),
        fromInfo,
        toInfo,
        call,
    };
}

export function formatLogEvent(evt: RawLogResponse, addressInfo?: AddressInfo, event?: EventData): FormattedLogEvent {
    return {
        removed: evt.removed,
        logIndex: evt.logIndex != null ? bigIntToNumber(evt.logIndex) : null,
        blockNumber: evt.blockNumber != null ? bigIntToNumber(evt.blockNumber) : null,
        blockHash: evt.blockHash,
        transactionHash: evt.transactionHash,
        transactionIndex: evt.transactionIndex != null ? bigIntToNumber(evt.transactionIndex) : null,
        address: toChecksumAddress(evt.address),
        data: evt.data,
        topics: evt.topics,
        addressInfo,
        event,
    };
}

/** Format a value into a floating-point number divided by decimals. */
export function formatHexToFloatingPoint(value: string, decimals: number): string {
    // first get value into a decimal radix:
    let formattedValue = value == '0x' ? '0' : BigInt(value).toString(10);
    // pad the value with as many zeros as needed:
    formattedValue = formattedValue.padStart(decimals + 1, '0');
    const integerPart = formattedValue.substr(0, formattedValue.length - decimals);
    if (integerPart == formattedValue) {
        return integerPart;
    }
    // now inject the floating number period:
    return integerPart + '.' + formattedValue.substr(formattedValue.length - decimals);
}
