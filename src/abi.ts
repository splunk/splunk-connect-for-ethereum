import { readdir, readFile, stat } from 'fs-extra';
import { basename, join } from 'path';
import { AbiCoder } from 'web3-eth-abi';
import { AbiInput, AbiItem, sha3, toChecksumAddress } from 'web3-utils';
import { computeContractFingerprint } from './contract';
import { createModuleDebug, TRACE_ENABLED } from './utils/debug';
import { ManagedResource } from './utils/resource';
import { RawLogResponse } from './eth/responses';
import { parseBigInt } from './utils/bn';

const { debug, warn, trace } = createModuleDebug('abi');

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

export interface DecodedLogEvent {
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
    return `${abi.name}(${(abi.inputs ?? []).map(i => i.type).join(',')})`;
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
            return parseBigInt(value as string);
        }
    }

    if (type.startsWith('int')) {
        if (typeof value === 'number') {
            return value;
        }
        if (intBits(type, 'int') <= 53) {
            return parseInt(value as string, 10);
        } else {
            return parseBigInt(value as string);
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

export class AbiRepository implements ManagedResource {
    private signatures: Map<string, AbiMatch> = new Map();
    private contracts: Map<string, ContractAbi> = new Map();
    private abiCoder: AbiCoder = require('web3-eth-abi');

    public async loadAbiDir(
        dir: string,
        { recursive = true, fileNameSuffix = '.json' }: { recursive?: boolean; fileNameSuffix?: string } = {}
    ): Promise<number> {
        debug('Searching for ABI files in %s', dir);
        const dirContents = await readdir(dir).catch(e =>
            Promise.reject(new Error(`Failed to load ABIs from directory ${dir}: ${e}`))
        );
        const subdirs = [];
        let loaded = 0;
        for (const f of dirContents) {
            const full = join(dir, f);
            const s = await stat(full);
            if (s.isDirectory() && recursive) {
                subdirs.push(join(dir, f));
            } else if (s.isFile() && f.endsWith(fileNameSuffix)) {
                await this.loadAbiFile(full);
                loaded++;
            }
        }
        const counts = await Promise.all(subdirs.map(sub => this.loadAbiDir(sub, { recursive, fileNameSuffix })));
        return loaded + counts.reduce((a, b) => a + b, 0);
    }

    public async loadAbiFile(path: string) {
        const contents = await readFile(path, { encoding: 'utf-8' });
        const data = JSON.parse(contents);
        this.loadAbi(data, path);
    }

    public loadAbi(abiData: any, fileName: string) {
        debug('Loading ABI %s', fileName);
        let abis: AbiItem[];
        let contractName: string;
        if (isTruffleBuildFile(abiData)) {
            abis = abiData.abi;
            contractName =
                abiData.contractName ||
                // Fall back to file name without file extension
                basename(fileName).split('.', 1)[0];
        } else if (isAbiArray(abiData)) {
            abis = abiData;
            contractName = basename(fileName).split('.', 1)[0];
        } else {
            warn('Invalid contents of ABI file %s', fileName);
            return;
        }

        const items = abis
            .filter(abi => (abi.type === 'function' || abi.type === 'event') && abi.name != null)
            .map(item => ({
                item,
                sigName: computeSignature({ name: item.name!, inputs: item.inputs ?? [], type: 'function' }),
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
            debug('Signature for %s %s => %s', item.type, sigName, sigHash);
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
                inputs: item.inputs ?? [],
                contractName,
                contractFingerprint,
                fileName,
            });
        }

        if (contractFingerprint != null) {
            debug('Computed contract fingerprint %s for contract signature %s', contractFingerprint, contractName);
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
        const sigHash = data.slice(2, 10);
        const match = this.signatures.get(sigHash);
        if (match == null) {
            return;
        }
        const abi = match.candidates.find(
            a => contractFingerprint == null || a.contractFingerprint === contractFingerprint
        );
        if (abi != null) {
            debug(
                'Found ABI %s matching fingerprint %s from contract %s',
                match.name,
                contractFingerprint,
                abi.contractName
            );
            const inputs = abi.inputs ?? [];
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
                signature: match.name,
                params,
                args,
            };
        } else if (TRACE_ENABLED) {
            trace(
                'No matching contract found for method signature %s hash %s and contract fingerprint %s',
                match.name,
                sigHash,
                contractFingerprint
            );
        }
        return;
    }

    public decodeLogEvent(logEvent: RawLogResponse, contractFingerprint?: string): DecodedLogEvent | undefined {
        const sigHash = logEvent.topics[0].slice(2);
        const match = this.signatures.get(sigHash);
        if (match != null) {
            const abi = match.candidates.find(c => c.contractFingerprint === contractFingerprint);
            if (abi != null) {
                debug('Found ABI %s matching fingerprint from contract %s', abi.name, abi.contractName);
                const { data, topics } = logEvent;
                const nonIndexedTypes = abi.inputs.filter(i => !i.indexed).map(i => i.type);
                const decodedData = this.abiCoder.decodeParameters(nonIndexedTypes, data.slice(2));
                let topicIndex = 1;
                let dataIndex = 0;
                const args: { [k: string]: Value } = {};
                const params = abi.inputs.map(input => {
                    let value;
                    if (input.indexed) {
                        if (isArrayType(input.type)) {
                            topicIndex++;
                            // we can't decode arrays since there is only a hash the log
                            value = [] as string[];
                        } else {
                            let rawValue = topics[topicIndex++];
                            if (input.type === 'address') {
                                rawValue = '0x' + rawValue.slice(-40);
                            }
                            value = decodeParameterValue(rawValue, input.type);
                        }
                    } else {
                        const rawValue = decodedData[dataIndex++];
                        value = isArrayType(input.type)
                            ? (rawValue as string[]).map(v => decodeParameterValue(v, elementType(input.type)))
                            : decodeParameterValue(rawValue, input.type);
                    }

                    args[input.name] = value;
                    return {
                        name: input.name,
                        type: input.type,
                        value,
                    };
                });
                return {
                    name: abi.name,
                    signature: match.name,
                    params,
                    args,
                };
            } else if (TRACE_ENABLED) {
                trace(
                    'No matching contract found for log event signature %s (hash %s) and contract fingerprint %s',
                    match.name,
                    sigHash,
                    contractFingerprint
                );
            }
        }
        return;
    }

    public async shutdown() {
        this.signatures.clear();
    }
}
