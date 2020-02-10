import { AbiInput } from 'web3-utils';

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
