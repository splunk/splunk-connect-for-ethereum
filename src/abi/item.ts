export type AbiType = 'function' | 'constructor' | 'event' | 'fallback';
export type StateMutabilityType = 'pure' | 'view' | 'nonpayable' | 'payable';

export interface AbiItem {
    anonymous?: boolean;
    constant?: boolean;
    inputs?: AbiInput[];
    name?: string;
    outputs?: AbiOutput[];
    payable?: boolean;
    stateMutability?: StateMutabilityType;
    type: AbiType;
}

export interface AbiInput {
    name: string;
    type: string;
    indexed?: boolean;
    components?: AbiInput[];
}

export interface AbiOutput {
    name: string;
    type: string;
    components?: AbiOutput[];
    internalType?: string;
}

/**
 * A single ABI definition of a function or a log event, with additional
 * information about the contract that contains the interface.
 */
export interface AbiItemDefinition {
    name: string;
    type: 'function' | 'event';
    inputs: AbiInput[];
    contractName?: string;
    contractFingerprint?: string;
    contractAddress?: string;
}
