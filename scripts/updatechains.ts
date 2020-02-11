import { debug as createDebug } from 'debug';
import { writeFile } from 'fs-extra';
import fetch from 'node-fetch';
import { join } from 'path';
import execa from 'execa';

const debug = createDebug('updatechains');
debug.enabled = true;

const CHAINS_URL = 'https://chainid.network/chains.json';

async function main() {
    debug('Downloading list of known chains from %s', CHAINS_URL);
    const res = await fetch(CHAINS_URL);
    const data = await res.json();
    debug('Writing %o known chains to file data/chains.json', data.length);
    const filePath = join(__dirname, '../data/chains.json');
    await writeFile(filePath, JSON.stringify(data, null, 2), { encoding: 'utf-8' });
    await execa('prettier', ['--write', filePath]);
}

main().catch(e => {
    debug('FATAL', e);
    process.exit(1);
});
