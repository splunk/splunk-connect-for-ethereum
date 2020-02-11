import { readdir, readFile, stat, createReadStream } from 'fs-extra';
import { basename, join as joinPath } from 'path';
import { AbiItem } from 'web3-utils';
import { AbiRepositoryConfig } from '../config';
import { Address } from '../msgs';
import { createModuleDebug } from '../utils/debug';
import { AbiItemDefinition } from './item';
import { computeContractFingerprint } from './contract';
import { computeSignature } from './signature';
import { createGunzip } from 'zlib';
import BufferList from 'bl';

const { debug, warn } = createModuleDebug('abi:files');

interface TruffleBuild {
    contractName: string;
    abi: AbiItem[];
    networks?: {
        [id: string]: {
            address: string;
        };
    };
}

export interface SignatureFileContents {
    type: 'function' | 'event';
    entries: Array<[string, AbiItemDefinition[]]>;
}

export function isAbiItemArray(obj: any): obj is AbiItem[] {
    return Array.isArray(obj);
}

export function isTruffleBuildFile(obj: any): obj is TruffleBuild {
    return typeof obj === 'object' && typeof obj.contractName === 'string' && Array.isArray(obj.abi);
}

export function extractDeployedContractAddresses(truffleBuild: TruffleBuild): Address[] | undefined {
    if (truffleBuild.networks) {
        return Object.values(truffleBuild.networks)
            .filter(({ address }) => address != null)
            .map(({ address }) => address.toLowerCase() as Address);
    }
}

export async function* searchAbiFiles(dir: string, config: AbiRepositoryConfig): AsyncIterable<string> {
    debug('Searching for ABI files in %s', dir);
    const dirContents = await readdir(dir).catch(e =>
        Promise.reject(new Error(`Failed to load ABIs from directory ${dir}: ${e}`))
    );
    const subdirs = [];
    for (const f of dirContents) {
        const full = joinPath(dir, f);
        const s = await stat(full);
        if (s.isDirectory() && (config.searchRecursive ?? true)) {
            subdirs.push(joinPath(dir, f));
        } else if (s.isFile() && f.endsWith(config.abiFileExtension ?? '.json')) {
            yield full;
        }
    }
    for (const sub of subdirs) {
        yield* searchAbiFiles(sub, config);
    }
}

export interface AbiFileContents {
    contractName: string;
    contractAddress?: string;
    contractFingerprint?: string;
    entries: Array<{
        abi: AbiItemDefinition;
        sig: string;
    }>;
}

export function parseAbiFileContents(
    abiData: any,
    { computeFingerprint, fileName }: { computeFingerprint: boolean; fileName: string }
): AbiFileContents {
    let abis: AbiItem[];
    let contractName: string;
    let contractAddress: string | undefined;
    if (isTruffleBuildFile(abiData)) {
        abis = abiData.abi;
        contractName =
            abiData.contractName ||
            // Fall back to file name without file extension
            basename(fileName).split('.', 1)[0];
        const addresses = extractDeployedContractAddresses(abiData);
        if (addresses != null) {
            if (addresses.length > 1) {
                warn(
                    'Found contract %s deployed to multiple (%d) networks, using address %s of first network',
                    contractName,
                    addresses.length,
                    addresses[0]
                );
            }
            contractAddress = addresses[0];
        }
    } else if (isAbiItemArray(abiData)) {
        abis = abiData;
        contractName = basename(fileName).split('.', 1)[0];
    } else {
        throw new Error(`Invalid contents of ABI file ${fileName}`);
    }

    const entries = abis
        .filter(abi => (abi.type === 'function' || abi.type === 'event') && abi.name != null)
        .map(abi => ({
            abi,
            sig: computeSignature({ name: abi.name!, inputs: abi.inputs ?? [], type: 'function' }),
        }));

    let contractFingerprint: string | undefined;
    if (computeFingerprint) {
        const functions = entries
            .filter(i => i.abi.type === 'function')
            .map(i => i.sig)
            .sort();
        const events = entries
            .filter(i => i.abi.type === 'event')
            .map(i => i.sig)
            .sort();

        contractFingerprint = computeContractFingerprint({ functions, events });
        debug('Computed contract fingerprint %s for contract signature %s', contractFingerprint, contractName);
    }

    return {
        contractName,
        contractAddress,
        contractFingerprint: contractFingerprint,
        entries: entries.map(item => ({
            sig: item.sig,
            abi: {
                name: item.abi.name!,
                type: item.abi.type as 'function' | 'event',
                inputs: item.abi.inputs ?? [],
                contractName,
                contractFingerprint,
                contractAddress,
            },
        })),
    };
}

export async function loadAbiFile(path: string, config: AbiRepositoryConfig): Promise<AbiFileContents> {
    const contents = await readFile(path, { encoding: 'utf-8' });
    const data = JSON.parse(contents);
    return await parseAbiFileContents(data, { fileName: path, computeFingerprint: config.fingerprintContracts });
}

export async function readGzipFile(path: string, { encoding = 'utf-8' }: { encoding?: string } = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        const result = new BufferList();
        createReadStream(path)
            .pipe(createGunzip())
            .on('data', chunk => {
                result.append(chunk);
            })
            .on('end', () => {
                resolve(result.toString(encoding));
            })
            .on('error', e => {
                reject(e);
            });
    });
}

export async function loadSignatureFile(path: string): Promise<SignatureFileContents> {
    const contents = await readGzipFile(path);
    return JSON.parse(contents);
}
