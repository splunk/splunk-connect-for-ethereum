import { readdir, readFile, stat } from 'fs-extra';
import { basename, join } from 'path';
import { AbiCoder } from 'web3-eth-abi';
import { AbiInput, AbiItem, sha3, toChecksumAddress } from 'web3-utils';
import { computeContractFingerprint } from './contract';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';

const { debug, warn } = createModuleDebug('abi');

export type ScalarValue = string | number | boolean;
export type Value = ScalarValue | ScalarValue[];

export interface DecodedParameter {
    name: string;
    type: string;
    value: Value;
}

export interface DecodedMethod {
    name: string;
    signature: string;
    params: DecodedParameter[];
    args: { [name: string]: Value };
}

interface TruffleBuild {
    contractName: string;
    abi: AbiItem[];
    networks?: {
        [id: string]: {
            address: string;
        };
    };
}

interface Abi {
    name: string;
    type: 'function' | 'event';
    inputs: AbiInput[];
    contractName?: string;
    fileName?: string;
    contractFingerprint?: string;
}

export function computeSignature(abi: Abi) {
    if (abi.name == null) {
        throw new Error('Cannot add ABI item without name');
    }
    return `${abi.name}(${(abi.inputs || []).map(i => i.type).join(',')})`;
}

export function computeSignatureHash(sigName: string, type: 'event' | 'function'): string {
    const hash = sha3(sigName);
    return type === 'event' ? hash.slice(2) : hash.slice(2, 10);
}

export function isAbiArray(obj: any): obj is AbiItem[] {
    return Array.isArray(obj);
}

export function isTruffleBuildFile(obj: any): obj is TruffleBuild {
    return typeof obj === 'object' && typeof obj.contractName === 'string' && Array.isArray(obj.abi);
}

export const intBits = (type: string, baseType: 'uint' | 'int'): number => +type.slice(baseType.length);

export function decodeParameterValue(value: string | number | boolean, type: string): ScalarValue {
    if (type === 'bool') {
        if (typeof value === 'boolean') {
            return value;
        }
        switch (value) {
            case '1':
                return true;
            case '0':
                return false;
            default:
                throw new Error(`Invalid boolean value: ${value}`);
        }
    }
    if (type.startsWith('uint')) {
        if (intBits(type, 'uint') <= 53) {
            return parseInt(value as string, 10);
        } else {
            const bn = BigInt(value);
            if (bn > BigInt(Number.MAX_SAFE_INTEGER)) {
                return bn.toString();
            } else {
                return parseInt(bn.toString(), 10);
            }
        }
    }

    if (type.startsWith('int')) {
        if (typeof value === 'number') {
            return value;
        }
        if (intBits(type, 'int') <= 53) {
            return parseInt(value as string, 10);
        } else {
            const bn = BigInt(value);
            if (bn > BigInt(Number.MAX_SAFE_INTEGER) || bn < BigInt(Number.MIN_SAFE_INTEGER)) {
                return bn.toString();
            } else {
                return parseInt(bn.toString(), 10);
            }
        }
    }

    if (type === 'address') {
        return toChecksumAddress(value as string);
    }

    return value;
}

const isArrayType = (type: string) => type.endsWith('[]');

function elementType(type: string): string {
    if (!type.endsWith('[]')) {
        throw new Error(`Not an array type: ${type}`);
    }
    return type.slice(0, -2);
}

interface AbiMatch {
    name: string;
    candidates: Abi[];
}

export interface ContractAbi {
    contractName: string;
    fileName: string;
}

export class AbiDecoder implements ManagedResource {
    private signatures: Map<string, AbiMatch> = new Map();
    private contracts: Map<string, ContractAbi> = new Map();
    private abiCoder: AbiCoder = require('web3-eth-abi');

    public async loadAbiDir(
        dir: string,
        { recursive = true, fileNameSuffix = '.json' }: { recursive?: boolean; fileNameSuffix?: string } = {}
    ) {
        debug('Searching for ABI files in %s', dir);
        const dirContents = await readdir(dir);
        const subdirs = [];
        for (const f of dirContents) {
            const full = join(dir, f);
            const s = await stat(full);
            if (s.isDirectory() && recursive) {
                subdirs.push(join(dir, f));
            } else if (s.isFile() && f.endsWith(fileNameSuffix)) {
                await this.loadAbiFile(full);
            }
        }
        await Promise.all(subdirs.map(sub => this.loadAbiDir(sub, { recursive, fileNameSuffix })));
    }

    public async loadAbiFile(path: string) {
        const contents = await readFile(path, { encoding: 'utf-8' });
        const data = JSON.parse(contents);
        this.loadAbi(data, path);
    }

    public loadAbi(abiData: any, fileName: string) {
        let abis: AbiItem[];
        let contractName: string;
        if (isTruffleBuildFile(abiData)) {
            abis = abiData.abi;
            contractName = abiData.contractName || fileName;
        } else if (isAbiArray(abiData)) {
            abis = abiData;
            contractName = basename(fileName);
        } else {
            warn('Invalid contents of ABI file %s', fileName);
            return;
        }

        const items = abis
            .filter(abi => (abi.type === 'function' || abi.type === 'event') && abi.name != null)
            .map(item => ({
                item,
                sigName: computeSignature({ name: item.name!, inputs: item.inputs || [], type: 'function' }),
            }));

        const functions = items
            .filter(i => i.item.type === 'function')
            .map(i => i.sigName)
            .sort();
        const events = items
            .filter(i => i.item.type === 'event')
            .map(i => i.sigName)
            .sort();

        const contractFingerprint = computeContractFingerprint({ functions, events });

        for (const i of items) {
            const { sigName, item } = i;
            const sigHash = computeSignatureHash(sigName, item.type as 'function' | 'event');
            let match: AbiMatch | undefined = this.signatures.get(sigHash);
            if (match == null) {
                match = {
                    name: sigName,
                    candidates: [],
                };
                this.signatures.set(sigHash, match);
            } else {
                if (match.name !== sigName) {
                    throw new Error(
                        `ABI signature collision for ${item.type} ${item.name} (saw names "${sigName}" and ${match.name})`
                    );
                }
            }
            match.candidates.push({
                name: item.name!,
                type: item.type as 'function' | 'event',
                inputs: item.inputs || [],
                contractName,
                contractFingerprint,
                fileName,
            });
        }

        if (contractFingerprint != null) {
            this.contracts.set(contractFingerprint, {
                contractName,
                fileName,
            });
        }
    }

    public get signatureCount(): number {
        return this.signatures.size;
    }

    public getMatchingAbi(signatureHash: string): AbiMatch | undefined {
        return this.signatures.get(signatureHash);
    }

    public getMatchingSignatureName(signatureHash: string): string | undefined {
        return this.signatures.get(signatureHash)?.name;
    }

    public getContractByFingerprint(fingerprint: string): ContractAbi | undefined {
        return this.contracts.get(fingerprint);
    }

    public decodeMethod(data: string, contractFingerprint?: string): DecodedMethod | undefined {
        const sig = data.slice(2, 10);
        const match = this.signatures.get(sig);
        if (match == null) {
            return;
        }
        const abi = match.candidates.find(
            a => contractFingerprint == null || a.contractFingerprint === contractFingerprint
        );
        if (abi != null) {
            debug(
                'Found ABI %s matching fingerprint %s from contract %s (%s)',
                match.name,
                contractFingerprint,
                abi.contractName,
                abi.fileName
            );
            const inputs = abi.inputs || [];
            const decodedParams = this.abiCoder.decodeParameters(
                inputs.map(i => i.type),
                data.slice(10)
            );
            const params: DecodedParameter[] = [];
            const args: { [name: string]: string | number | boolean | Array<string | number | boolean> } = {};

            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const rawValue = decodedParams[i];
                const value = isArrayType(input.type)
                    ? (rawValue as string[]).map(v => decodeParameterValue(v, elementType(input.type)))
                    : decodeParameterValue(rawValue, input.type);
                args[input.name!] = value;
                params.push({
                    name: input.name!,
                    type: input.type,
                    value,
                });
            }

            return {
                name: abi.name!,
                signature: sig,
                params,
                args,
            };
        }
        return;
    }

    public async shutdown() {
        this.signatures.clear();
    }
}
