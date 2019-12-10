import { JsonRpcRequest, JsonRpcResponse } from './jsonrpc';

export interface EthereumTransport {
    source: string;
    send(request: JsonRpcRequest): Promise<JsonRpcResponse>;
    sendBatch(requests: JsonRpcRequest[]): Promise<JsonRpcResponse[]>;
}
