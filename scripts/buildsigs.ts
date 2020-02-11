import { debug as createDebug } from 'debug';
import { createWriteStream, readFile } from 'fs-extra';
import { createGzip } from 'zlib';
import { computeSignatureHash, validateSignature, parseSignature } from '../src/abi/signature';
import { AbiItemDefinition } from '../src/abi/item';

const debug = createDebug('buildsigs');
debug.enabled = true;

async function readSignatureFile(file: string): Promise<Iterable<string>> {
    debug('Loading signatures from %o', file);
    const allSignatures = [];
    const d = await readFile(file, { encoding: 'utf-8' });
    for (const line of d.split('\n')) {
        if (line) {
            allSignatures.push(line);
        }
    }
    return allSignatures;
}

async function buildSignatureFile(sourceFile: string, destFile: string, type: 'function' | 'event') {
    const fns = await readSignatureFile(sourceFile);
    const sigHashMap = new Map<string, string[]>();
    for (const sig of fns) {
        try {
            validateSignature(sig);
        } catch (e) {
            debug('Ignoring invalid function signature %o (%s)', sig, e.message);
            continue;
        }
        const hash = computeSignatureHash(sig, type);
        if (sigHashMap.has(hash)) {
            const newSigs = [sig, ...sigHashMap.get(hash)!];
            debug('WARN: hash collision detected hash=%o | %s signatures: %o', hash, type, newSigs);
            sigHashMap.set(hash, newSigs);
        } else {
            sigHashMap.set(hash, [sig]);
        }
    }

    const entries: [string, AbiItemDefinition[]][] = [];
    for (const [hash, sigs] of sigHashMap.entries()) {
        entries.push([hash, sigs.map(s => parseSignature(s, type))]);
    }

    await new Promise((resolve, reject) => {
        const stream = createGzip({ level: 9 });
        const dest = createWriteStream(destFile);
        stream.pipe(dest);
        stream.once('end', () => {
            resolve();
        });
        stream.once('error', e => reject(e));
        stream.write(JSON.stringify({ type, entries }));
        stream.end();
    });
    debug('Write %o signatures to %s', entries.length, destFile);
}

async function main() {
    await buildSignatureFile('data/function_signatures.txt', 'data/fns.abisigs.gz', 'function');
    await buildSignatureFile('data/event_signatures.txt', 'data/evts.abisigs.gz', 'event');
}

main().catch(e => {
    debug('FATAL', e);
    process.exit(1);
});
