import { debug as createDebug } from 'debug';
import { createWriteStream, readFile } from 'fs-extra';
import { createGzip } from 'zlib';
import { getInputSize } from '../src/abi/decode';
import { AbiItemDefinition } from '../src/abi/item';
import { computeSignatureHash, parseSignature, validateSignature, computeSignature } from '../src/abi/signature';
import { sortAbis } from '../src/abi/repo';

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
    let invalidCount = 0;
    let totalCount = 0;
    for (const sig of fns) {
        totalCount++;
        try {
            validateSignature(sig, type);
            getInputSize(parseSignature(sig, type));
        } catch (e) {
            debug('Ignoring invalid function signature %o (%s)', sig, e.message);
            invalidCount++;
            continue;
        }
        const hash = computeSignatureHash(sig, type);
        if (sigHashMap.has(hash)) {
            const newSigs = [sig, ...sigHashMap.get(hash)!];
            sigHashMap.set(hash, newSigs);
        } else {
            sigHashMap.set(hash, [sig]);
        }
    }

    debug('Ignored %d invalid out of %d total signatures', invalidCount, totalCount);

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

    const collisions = entries.filter(([sig, items]) => items.length > 1);

    if (collisions.length > 0) {
        debug('\nFound %d hash collisions:\n', collisions.length);

        for (const [sig, items] of collisions) {
            debug(
                `Hash ${sig}:\n${sortAbis(items)
                    .map(i => '  - ' + computeSignature(i))
                    .join('\n')}`
            );
        }
    } else {
        debug('\nNo hash collisions detected\n');
    }
}

async function main() {
    debug('Building function signatures...\n');
    await buildSignatureFile('data/function_signatures.txt', 'data/fns.abisigs.gz', 'function');
    debug('Building event signatures...\n');
    await buildSignatureFile('data/event_signatures.txt', 'data/evts.abisigs.gz', 'event');
}

main().catch(e => {
    debug('FATAL', e);
    process.exit(1);
});
