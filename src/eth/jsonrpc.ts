let msgId: number = 0;

const nextMsgId = (): number => ++msgId;

export class JsonRpcError extends Error {
    constructor(message: string, public readonly code?: number, public readonly data?: any) {
        super(message);
    }
}

export class InvalidJsonRpcResponseError extends JsonRpcError {
    constructor(message: string, data?: any) {
        super(`Invalid JSON RPC response: ${message}`, undefined, data);
    }
}

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

export function checkError(msg?: JsonRpcResponse) {
    if (msg?.error) {
        throw new JsonRpcError(msg.error.message, msg.error.code, msg.error.data);
    }
    if (msg?.result == null) {
        throw new JsonRpcError('No result');
    }
}

export function validateJsonRpcResponse(response: any): response is JsonRpcResponse | JsonRpcResponse[] {
    if (response == null) {
        throw new InvalidJsonRpcResponseError('Response message is null/empty');
    }

    if (Array.isArray(response)) {
        return response.every(validateJsonRpcResponse);
    }

    if (response.jsonrpc !== '2.0') {
        throw new InvalidJsonRpcResponseError(`Invalid jsonrpc value (${response.jsonrpc}) in message`);
    }

    if (!(typeof response.id === 'number' || typeof response.id === 'string')) {
        throw new InvalidJsonRpcResponseError(`Invalid message ID (type: ${typeof response.id}) in message`);
    }

    return true;
}
