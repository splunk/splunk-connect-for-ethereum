import { join as joinPath } from 'path';
import { AbiRepositoryConfig } from '../config';
import { RawLogResponse } from '../eth/responses';
import { createModuleDebug, TRACE_ENABLED } from '../utils/debug';
import { ManagedResource } from '../utils/resource';
import {
    decodeBestMatchingFunctionCall,
    decodeBestMatchingLogEvent,
    DecodedFunctionCall,
    DecodedLogEvent,
} from './decode';
import { loadAbiFile, loadSignatureFile, searchAbiFiles, AbiFileContents } from './files';
import { AbiItemDefinition } from './item';
import { computeSignature, computeSignatureHash } from './signature';

const { warn, debug, info, trace } = createModuleDebug('abi:repo');

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
    fileName?: string;
}

/** Sort abi defintions in consistent priority order */
export function sortAbis(abis: AbiItemDefinition[]): AbiItemDefinition[] {
    if (abis.length > 1) {
        const sortedAbis = [...abis];
        sortedAbis.sort((a, b) => {
            // Always prefer user-supplied abis with an contract address attached
            const aHasAddress = a.contractAddress != null;
            const bHasAddress = b.contractAddress != null;
            if (aHasAddress !== bHasAddress) {
                return aHasAddress ? -1 : 1;
            }
            // Prefer user-supplied abi
            const aHasFingerprint = a.contractFingerprint != null;
            const bHasFingerprint = b.contractFingerprint != null;
            if (aHasFingerprint !== bHasFingerprint) {
                return aHasFingerprint ? -1 : 1;
            }
            return (
                // Prefer abis with shorter function name as longer ones
                // are sometimes used to deliberately produce signature hash
                // collisions
                a.name.length - b.name.length ||
                // Prefer abis with fewer parameters
                a.inputs.length - b.inputs.length ||
                // Sort the rest by name
                a.name.localeCompare(b.name) ||
                // Last restort is to string compare the full signature
                computeSignature(a).localeCompare(computeSignature(b))
            );
        });
        return sortedAbis;
    }
    return abis;
}

export class AbiRepository implements ManagedResource {
    private signatures: Map<string, AbiItemDefinition[]> = new Map();
    private contractsByFingerprint: Map<string, ContractAbi> = new Map();
    private contractsByAddress: Map<string, ContractAbi> = new Map();

    constructor(private config: AbiRepositoryConfig) {}

    private addToSignatures(sig: string, abis: AbiItemDefinition[]) {
        const match = this.signatures.get(sig);
        this.signatures.set(sig, sortAbis(match == null ? abis : [...match, ...abis]));
    }

    public async initialize() {
        const config = this.config;
        debug('Initializing ABI repository with config %O', config);
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
            this.addToSignatures(sig, abis);
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
        this.addAbi(abiFileContents);
    }

    public addAbi(abiFileContents: AbiFileContents) {
        const contractInfo: ContractAbi = {
            contractName: abiFileContents.contractName,
            fileName: abiFileContents.fileName,
        };
        if (abiFileContents.contractAddress != null) {
            this.contractsByAddress.set(abiFileContents.contractAddress.toLowerCase(), contractInfo);
        }
        if (abiFileContents.contractFingerprint != null) {
            if (this.contractsByFingerprint.has(abiFileContents.contractFingerprint)) {
                warn(
                    'Duplicate contract fingerprint for contracts %o and %o',
                    contractInfo,
                    this.contractsByFingerprint.get(abiFileContents.contractFingerprint)
                );
            } else {
                this.contractsByFingerprint.set(abiFileContents.contractFingerprint, contractInfo);
            }
        }

        for (const { sig, abi } of abiFileContents.entries) {
            const signatureHash = computeSignatureHash(sig, abi.type);
            this.addToSignatures(signatureHash, [abi]);
        }
    }

    public get signatureCount(): number {
        return this.signatures.size;
    }

    public getMatchingAbi(signatureHash: string): AbiMatch | undefined {
        const candidates = this.signatures.get(signatureHash);
        return candidates != null ? { anonymous: true, candidates } : undefined;
    }

    public getMatchingSignature(signatureHash: string): string | undefined {
        const candidates = this.signatures.get(signatureHash);
        trace(
            'getMatchingSignature(%o) --> ',
            signatureHash,
            candidates?.filter(c => c.contractFingerprint != null)?.map(c => computeSignature(c))
        );
        if (candidates != null) {
            // We only want to consider signatures from contracts in our repo
            // that already have a fingerprint
            const filtered = candidates.filter(c => c.contractFingerprint != null);
            const signatures = new Set<string>(filtered.map(c => computeSignature(c)));
            if (signatures.size > 1) {
                throw new Error(`Multiple signatures (${[...signatures].join(', ')}) for sig hash ${signatureHash}`);
            }
            if (filtered.length > 0) {
                return computeSignature(filtered[0]);
            }
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
            trace(
                'Looking for contract match %o for signature hash %s; candidates: %O',
                { contractAddress, contractFingerprint },
                sigHash,
                match.map(item => ({
                    name: item.contractName,
                    signature: computeSignature(item),
                    address: item.contractAddress,
                    fingerprint: item.contractFingerprint,
                }))
            );
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
                if (this.config.requireContractMatch === false) {
                    return { candidates: match, anonymous: false };
                }
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
        decoder: (abis: AbiItemDefinition[], anonymous: boolean) => T
    ): T | undefined {
        const matchingAbis = this.findMatchingAbis(sigHash, matchParams);
        trace('Found %d matching ABIs for signature %s', matchingAbis?.candidates?.length ?? 0, sigHash);

        if (matchingAbis != null) {
            if (matchingAbis.anonymous && !this.config.decodeAnonymous) {
                return;
            }
            if (matchingAbis.candidates.length === 0) {
                trace('No matching ABI found for signature hash %s', sigHash);
                return;
            }
            try {
                return decoder(matchingAbis.candidates, matchingAbis.anonymous);
            } catch (e) {
                if (matchingAbis!.anonymous) {
                    debug('Failed to decode anonymous ABI', e);
                } else {
                    warn('Failed to decode ABI', e);
                }
            }
        }
    }

    public decodeFunctionCall(data: string, matchParams: AbiMatchParams): DecodedFunctionCall | undefined {
        const sigHash = data.slice(2, 10);
        return this.abiDecode(sigHash, matchParams, (abi, anon) => decodeBestMatchingFunctionCall(data, abi, anon));
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

        return this.abiDecode(sigHash, matchParams, (abi, anon) => decodeBestMatchingLogEvent(data, topics, abi, anon));
    }

    public async shutdown() {
        this.signatures.clear();
    }
}
