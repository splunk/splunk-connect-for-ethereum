import { EthereumClient } from '../eth/client';
import { getCode } from '../eth/requests';
import { Address } from '../msgs';
import { createModuleDebug, TRACE_ENABLED } from '../utils/debug';
import { sha3 } from './wasm';
import { ContractBytecode } from '../eth/evm';
import { ProxyContractInfo, detectProxyContract } from '../eth/proxy';

const { debug, trace } = createModuleDebug('abi:contract');

export interface ContractInfo {
    /** True if the corresponding account is a smart contract, otherwise false */
    isContract: boolean;
    /** A unique representation of all function and event signatures of a contract */
    fingerprint?: string;
    /** Name of the contract from configured ABIs */
    contractName?: string;
    /** Information  */
    proxy?: ProxyContractInfo;
}

/** Lookup function to find matching signature for a hash */
export type SignatureMatcher = (sig: string, address?: Address) => string | undefined;

/** Lookup function to find name for a given contract address or fingerprint */
export type ContractNameLookup = (address: Address, fingerprint: string) => string | undefined;

/**
 * Find function and event signature hashes in the EVM bytecode and attempt to match them against
 * known hashes from configured ABIs
 */
export function extractFunctionsAndEvents(
    contractCode: ContractBytecode,
    signatureMatcher: SignatureMatcher
): { functions: string[]; events: string[] } | undefined {
    const functionMatches: Set<string> = new Set();
    const eventMatches: Set<string> = new Set();

    for (const data of contractCode.getPossibleSignatureHashes()) {
        const match = signatureMatcher(data);
        if (match) {
            (data.length === 8 ? functionMatches : eventMatches).add(match);
        }
    }

    const functions = [...functionMatches].sort();
    const events = [...eventMatches].sort();
    return { functions, events };
}

/** Creates a hash of all function and event signatures of a contract used to match ABIs against EVM bytecode */
export function computeContractFingerprint(
    { functions, events }: { functions: string[]; events: string[] } = { functions: [], events: [] }
): string | undefined {
    if (functions.length === 0 && events.length === 0) {
        return;
    }
    const fingerprint = sha3(`${functions.join(',')}|${events.join(',')}`)!.slice(2);
    return fingerprint;
}

/**
 * Attempts to determine if the given account address is a smart contract and
 * determines some additional information if that's the case
 */
export async function getContractInfo(
    address: Address,
    ethClient: EthereumClient,
    {
        detectProxy = false,
        signatureMatcher,
        contractNameLookup,
    }: {
        detectProxy?: boolean;
        signatureMatcher?: SignatureMatcher;
        contractNameLookup?: ContractNameLookup;
    } = {}
): Promise<ContractInfo> {
    debug('Retrieving contract information for address %s', address);
    const bytecode = await ethClient.request(getCode(address));
    if (bytecode === '0x') {
        return { isContract: false };
    }
    if (signatureMatcher == null) {
        return { isContract: true };
    }
    const code = new ContractBytecode(bytecode);
    const fnsEvts = extractFunctionsAndEvents(code, (fingerprint: string) => signatureMatcher(fingerprint, address));
    const fingerprint = computeContractFingerprint(fnsEvts);
    if (TRACE_ENABLED) {
        trace('Computed fingerprint %s from contract code %O', fingerprint, fnsEvts);
    }
    const contractName =
        fingerprint != null && contractNameLookup != null ? contractNameLookup(address, fingerprint) : undefined;

    let proxy = undefined;
    if (detectProxy) {
        proxy = await detectProxyContract(address, code, ethClient);
    }

    return {
        isContract: true,
        fingerprint,
        contractName,
        proxy,
    };
}
