import { debug as createDebug } from 'debug';
import { readFile, writeFile } from 'fs-extra';
import fetch from 'node-fetch';
import { sleep } from '../src/utils/async';

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

async function* scrape4bytedirectory() {
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
}

function validateSignature(sig: string): boolean {
    // todo
    if (!sig || !sig.trim()) {
        debug('Ignoring invalid signature %o', sig);
        return false;
    }
    return true;
}

async function main() {
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
    for await (const sig of scrape4bytedirectory()) {
        if (!fns.has(sig) && validateSignature(sig)) {
            fns.add(sig);
            if (Date.now() - lastWrite > 30_000) {
                await writeSignatureFile('data/function_signatures.txt', fns);
                lastWrite = Date.now();
            }
        }
    }

    await writeSignatureFile('data/function_signatures.txt', fns);

    const evts = new Set<string>();
    const evmEvtSigList: string[] = await fetch(
        'https://raw.githubusercontent.com/MrLuit/evm/master/data/events.json'
    ).then(r => r.json());
    debug('Downloaded %o event signatures from github.com/MrLuit/evm repo', evmEvtSigList.length);
    evmEvtSigList.forEach(sig => {
        if (!evts.has(sig) && validateSignature(sig)) {
            evts.add(sig);
        }
    });
    await writeSignatureFile('data/event_signatures.txt', evts);
}

main().catch(e => {
    debug('FATAL:', e);
    process.exit(1);
});
