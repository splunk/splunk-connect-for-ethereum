import { join as joinPath } from 'path';
import { AbiCoder } from 'web3-eth-abi';
import { AbiRepositoryConfig } from '../config';
import { RawLogResponse } from '../eth/responses';
import { createModuleDebug, TRACE_ENABLED } from '../utils/debug';
import { ManagedResource } from '../utils/resource';
import { AbiItemDefinition } from './item';
import { DecodedFunctionCall, DecodedLogEvent, decodeFunctionCall, decodeLogEvent } from './decode';
import { loadAbiFile, searchAbiFiles, loadSignatureFile } from './files';
import { computeSignature, computeSignatureHash } from './signature';

const { debug, info, trace } = createModuleDebug('abi:repo');

interface AbiMatch {
    anonymous: boolean;
    candidates: AbiItemDefinition[];
}

interface AbiMatchParams {
    contractFingerprint?: string;
    contractAddress?: string;
}

export interface ContractAbi {
    contractName: string;
}

export class AbiRepository implements ManagedResource {
    private signatures: Map<string, AbiItemDefinition[]> = new Map();
    private contractsByFingerprint: Map<string, ContractAbi> = new Map();
    private contractsByAddress: Map<string, ContractAbi> = new Map();
    private abiCoder: AbiCoder = require('web3-eth-abi');

    constructor(private config: AbiRepositoryConfig) {}

    public async initialize() {
        const config = this.config;
        if (config.directory != null) {
            const abiCount = await this.loadAbisFromDir(config.directory!, config);
            info('Loaded %d ABIs from directory %s', abiCount, config.directory);
        }

        if (config.decodeAnonymous) {
            const fnCount = await this.loadAnonymousSignatures(joinPath(__dirname, '../../data/fns.abisigs.gz'));
            const evCount = await this.loadAnonymousSignatures(joinPath(__dirname, '../../data/evts.abisigs.gz'));
            info('Loaded %d anonymous ABI signatures from built-in signature files', fnCount + evCount);
        }
    }

    public async loadAnonymousSignatures(file: string): Promise<number> {
        debug('Loading anonymous signatures from %s', file);
        let count = 0;
        const { entries } = await loadSignatureFile(file);
        for (const [sig, abis] of entries) {
            const match = this.signatures.get(sig);
            if (match == null) {
                this.signatures.set(sig, abis);
            } else {
                for (const abi of abis) {
                    match.push(abi);
                }
            }
            count++;
        }
        return count;
    }

    public async loadAbisFromDir(dir: string, config: AbiRepositoryConfig): Promise<number> {
        let count = 0;
        for await (const abiFile of searchAbiFiles(dir, config)) {
            await this.loadAbiFile(abiFile, config);
            count++;
        }
        return count;
    }

    public async loadAbiFile(path: string, config: AbiRepositoryConfig) {
        const abiFileContents = await loadAbiFile(path, config);
        const contractInfo: ContractAbi = {
            contractName: abiFileContents.contractName,
        };
        if (abiFileContents.contractAddress != null) {
            this.contractsByAddress.set(abiFileContents.contractAddress.toLowerCase(), contractInfo);
        }
        if (abiFileContents.contractFingerprint != null) {
            this.contractsByFingerprint.set(abiFileContents.contractFingerprint, contractInfo);
        }

        for (const { sig, abi } of abiFileContents.entries) {
            const signatureHash = computeSignatureHash(sig, abi.type);
            let match = this.signatures.get(signatureHash);
            if (match == null) {
                match = [abi];
                this.signatures.set(signatureHash, match);
            } else {
                match.push(abi);
            }
        }
    }

    public get signatureCount(): number {
        return this.signatures.size;
    }

    public getMatchingAbi(signatureHash: string): AbiMatch | undefined {
        const candidates = this.signatures.get(signatureHash);
        return candidates != null ? { anonymous: true, candidates } : undefined;
    }

    public getMatchingSignatureName(signatureHash: string): string | undefined {
        const candidates = this.signatures.get(signatureHash);
        if (candidates != null) {
            return computeSignature(candidates[0]);
        }
    }

    public getContractByFingerprint(fingerprint: string): ContractAbi | undefined {
        return this.contractsByFingerprint.get(fingerprint);
    }

    public getContractByAddress(address: string): ContractAbi | undefined {
        return this.contractsByAddress.get(address?.toLowerCase());
    }

    public findMatchingAbis(
        sigHash: string,
        { contractFingerprint, contractAddress }: AbiMatchParams
    ): AbiMatch | undefined {
        const match = this.signatures.get(sigHash);
        if (match != null) {
            if (contractAddress != null) {
                const addressMatch = match.find(c => c.contractAddress === contractAddress.toLowerCase());
                if (addressMatch != null) {
                    return { candidates: [addressMatch], anonymous: false };
                }
            }
            if (contractFingerprint != null) {
                const fingerprintMatch = match.filter(c => c.contractFingerprint === contractFingerprint);
                if (fingerprintMatch.length > 0) {
                    return { candidates: fingerprintMatch, anonymous: false };
                }
            }
            if (match.length > 0) {
                return { candidates: match, anonymous: true };
            }
            if (TRACE_ENABLED) {
                trace(
                    'No matching contract found for method signature hash %s and contract fingerprint %s',
                    sigHash,
                    contractFingerprint
                );
            }
        }
        return { candidates: [], anonymous: true };
    }

    private abiDecode<T>(
        sigHash: string,
        matchParams: AbiMatchParams,
        decodeFn: (abi: AbiItemDefinition, signature: string, anonymous: boolean) => T
    ): T | undefined {
        const matchingAbis = this.findMatchingAbis(sigHash, matchParams);
        trace('Found %d matching ABIs for signature %s', matchingAbis?.candidates?.length ?? 0, sigHash);

        if (matchingAbis != null) {
            if (matchingAbis.anonymous && !this.config.decodeAnonymous) {
                return;
            }
            for (const abi of matchingAbis.candidates) {
                const signature = computeSignature(abi);
                debug('Found ABI %s matching %o from contract %s', signature, matchParams, abi.contractName);
                try {
                    return decodeFn(abi, signature, matchingAbis!.anonymous);
                } catch (e) {
                    debug('Failed to decode function call');
                }
            }
        }
    }

    public decodeFunctionCall(data: string, matchParams: AbiMatchParams): DecodedFunctionCall | undefined {
        const sigHash = data.slice(2, 10);
        return this.abiDecode(sigHash, matchParams, (abi, sig, anon) =>
            decodeFunctionCall(data, abi, sig, this.abiCoder, anon)
        );
    }

    public decodeLogEvent(logEvent: RawLogResponse, matchParams: AbiMatchParams): DecodedLogEvent | undefined {
        if (!Array.isArray(logEvent.topics) || logEvent.topics.length === 0) {
            if (TRACE_ENABLED) {
                trace(
                    'No topics in log event tx=%s idx=%s - nothing to decode',
                    logEvent.transactionHash,
                    logEvent.logIndex
                );
            }
            return;
        }
        const sigHash = logEvent.topics[0].slice(2);
        const { data, topics } = logEvent;

        return this.abiDecode(sigHash, matchParams, (abi, sig, anon) =>
            decodeLogEvent(data, topics, abi, sig, this.abiCoder, anon)
        );
    }

    public async shutdown() {
        this.signatures.clear();
    }
}
