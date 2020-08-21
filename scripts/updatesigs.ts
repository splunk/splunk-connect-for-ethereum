import { debug as createDebug } from 'debug';
import { readFile, writeFile } from 'fs-extra';
import fetch from 'node-fetch';
import { sleep } from '../src/utils/async';
import { searchAbiFiles, loadAbiFile } from '../src/abi/files';
import { serializeEventSignature } from '../src/abi/signature';

const debug = createDebug('updatesigs');
debug.enabled = true;

interface SignatureApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Array<{
        id: number;
        created_at: string;
        text_signature: string;
        hex_signature: string;
        bytes_signature: string;
    }>;
}

interface UpdaterState {
    fourByteCursor?: number;
}

const STATE_FILE = '.sigupdaterstate';

async function loadUpdateState(): Promise<UpdaterState> {
    const data = await readFile(STATE_FILE, { encoding: 'utf-8' });
    return JSON.parse(data);
}

async function storeUpdaterState(state: UpdaterState) {
    await writeFile(STATE_FILE, JSON.stringify(state, null, 4), { encoding: 'utf-8' });
}

async function readSignatureFile(file: string): Promise<Set<string>> {
    const allSignatures = new Set<string>();
    const d = await readFile(file, { encoding: 'utf-8' });
    for (const line of d.split('\n')) {
        if (line) {
            allSignatures.add(line);
        }
    }
    return allSignatures;
}

async function writeSignatureFile(file: string, sigs: Set<string>) {
    const sortedSignatures = [...sigs];
    sortedSignatures.sort();
    debug('Writing %o signatures to %s', sortedSignatures.length, file);
    await writeFile(file, sortedSignatures.join('\n'), { encoding: 'utf-8' });
}

const retry = async <T>(task: () => Promise<T>, attempts: number) => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await task();
        } catch (e) {
            debug('Attempt #%d failed. Retrying in 10 seconds');
            await sleep(10_000);
        }
    }
    throw new Error(`Task failed after ${attempts} attempts`);
};

async function* scrape4bytedirectory(state: UpdaterState) {
    const nextUrl = (path: string): string => new URL(path, 'https://www.4byte.directory').href;
    let nextPath = '/api/v1/signatures/';
    let maxId = 0;
    let minId = Infinity;
    let count = 0;
    while (true) {
        try {
            debug('Fetching path %o', nextPath);
            const data: SignatureApiResponse = await retry(
                () =>
                    fetch(nextUrl(nextPath)).then(res => {
                        if (res.status > 299) {
                            throw new Error(`HTTP status ${res.status}`);
                        }
                        return res.json();
                    }),
                100
            );

            for (const entry of data.results) {
                count++;
                yield entry.text_signature;
                maxId = Math.max(entry.id, maxId);
                minId = Math.min(entry.id, minId);
            }

            if (data.next) {
                if (state.fourByteCursor != null && minId <= state.fourByteCursor) {
                    debug('Passed cursor %d for 4byte.directory', state.fourByteCursor);
                    break;
                }
                state.fourByteCursor = maxId;
                nextPath = data.next;
            } else {
                debug('No next link, seems we reached the end of the list');
                break;
            }
        } catch (e) {
            debug('ERROR', e);
            return;
        }
    }
    debug('Found %o signatures between IDs %o to %o', count, minId, maxId);
    state.fourByteCursor = maxId;
}

function validateSignature(sig: string): boolean {
    if (!sig || !sig.trim()) {
        debug('Ignoring invalid signature %o', sig);
        return false;
    }
    return true;
}

const ABI_REPO_CONFIG = {
    decodeAnonymous: true,
    fingerprintContracts: false,
    requireContractMatch: false,
    abiFileExtension: '.json',
};

async function main() {
    debug('Updating function signatures...');
    const state = await loadUpdateState();
    const fns = await readSignatureFile('data/function_signatures.txt');
    for (const prevSig of fns) {
        if (!validateSignature(prevSig)) {
            fns.delete(prevSig);
        }
    }
    const evmFnSigList: string[] = await fetch(
        'https://raw.githubusercontent.com/MrLuit/evm/master/data/functions.json'
    ).then(r => r.json());
    debug('Downloaded %o function signatures from github.com/MrLuit/evm repo', evmFnSigList.length);
    evmFnSigList.forEach(sig => {
        if (!fns.has(sig) && validateSignature(sig)) {
            fns.add(sig);
        }
    });

    let lastWrite = 0;
    for await (const sig of scrape4bytedirectory(state)) {
        if (!fns.has(sig) && validateSignature(sig)) {
            fns.add(sig);
            if (Date.now() - lastWrite > 30_000) {
                await writeSignatureFile('data/function_signatures.txt', fns);
                await storeUpdaterState(state);
                lastWrite = Date.now();
            }
        }
    }

    for await (const abiFile of searchAbiFiles('test/abis', ABI_REPO_CONFIG)) {
        const contents = await loadAbiFile(abiFile, ABI_REPO_CONFIG);
        for (const fn of contents.entries.filter(e => e.abi.type === 'function')) {
            fns.add(fn.sig);
        }
    }

    await writeSignatureFile('data/function_signatures.txt', fns);

    debug('Updating event signatures...');
    const evts = await readSignatureFile('data/event_signatures.txt');
    for await (const abiFile of searchAbiFiles('test/abis', ABI_REPO_CONFIG)) {
        const contents = await loadAbiFile(abiFile, ABI_REPO_CONFIG);
        for (const evt of contents.entries.filter(e => e.abi.type === 'event')) {
            evts.add(serializeEventSignature(evt.abi));
        }
    }
    await writeSignatureFile('data/event_signatures.txt', evts);
    await storeUpdaterState(state);
}

main().catch(e => {
    debug('FATAL:', e);
    process.exit(1);
});
