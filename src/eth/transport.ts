import { JsonRpcRequest, JsonRpcResponse } from './jsonrpc';

export interface EthereumTransport {
    send(request: JsonRpcRequest): Promise<JsonRpcResponse>;
    sendBatch(requests: JsonRpcRequest[]): Promise<JsonRpcResponse[]>;
}
