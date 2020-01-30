let msgId: number = 0;

const nextMsgId = (): number => ++msgId;

export interface JsonRpcRequest {
    jsonrpc: string;
    method: string;
    params: any[];
    id: number;
}

export interface JsonRpcResponse {
    jsonrpc: string;
    id: number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export function createJsonRpcPayload(method: string, params?: any[]): JsonRpcRequest {
    return {
        jsonrpc: '2.0',
        id: nextMsgId(),
        method,
        params: params ?? [],
    };
}

const validateSingleMessage = (message: any): message is JsonRpcResponse =>
    message != null &&
    message.jsonrpc === '2.0' &&
    (typeof message.id === 'number' || typeof message.id === 'string') &&
    (message.result != null || message.error != null);

export class JsonRpcError extends Error {
    constructor(message: string, public readonly code?: number, public readonly data?: any) {
        super(message);
    }
}

export function checkError(msg?: JsonRpcResponse) {
    if (msg?.error) {
        throw new JsonRpcError(msg.error.message, msg.error.code, msg.error.data);
    }
}

export function isValidJsonRpcResponse(response: any): response is JsonRpcResponse | JsonRpcResponse[] {
    return Array.isArray(response) ? response.every(validateSingleMessage) : validateSingleMessage(response);
}
