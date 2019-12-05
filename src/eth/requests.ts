import { hexToNumber, numberToHex } from 'web3-utils';
import { JsonRpcResponse } from './jsonrpc';
import { RawBlockResponse, RawTransactionReceipt } from './responses';

export interface EthRequest<P extends any[], R> {
    method: string;
    params?: P;
    response: (r: JsonRpcResponse) => R;
}

export const blockNumber = (): EthRequest<[], number> => ({
    method: 'eth_blockNumber',
    response: (r: JsonRpcResponse) => hexToNumber(r.result),
});

export const getBlock = (
    blockNumber: number | 'latest' | 'pending'
): EthRequest<[string, boolean], RawBlockResponse> => ({
    method: 'eth_getBlockByNumber',
    params: [typeof blockNumber === 'number' ? numberToHex(blockNumber) : blockNumber, true],
    response: r => r.result,
});

export const getTransactionReceipt = (txHash: string): EthRequest<[string], RawTransactionReceipt> => ({
    method: 'eth_getTransactionReceipt',
    params: [txHash],
    response: r => r.result,
});

export const getCode = (address: string): EthRequest<[string, string], string> => ({
    method: 'eth_getCode',
    params: [address, 'latest'],
    response: r => r.result,
});
