import { addPath, debug, setFailed, getInput } from '@actions/core';
import { exec } from '@actions/exec';
import { downloadTool } from '@actions/tool-cache';
import { homedir } from 'os';
import * as path from 'path';

async function main() {
    const rustVersion = getInput('rust-version');

    try {
        await installRustup();
        await installToolchain(rustVersion);
        await installWasmPack();
    } catch (e) {
        setFailed(`Error: ${e}`);
    }
}

async function installRustup() {
    debug('Installing rustup');
    const script = await downloadTool('https://sh.rustup.rs');
    await exec('sh', [script, '-y', '--default-toolchain', 'none']);
    addPath(path.join(homedir(), '.cargo', 'bin'));
}

async function installToolchain(version: string = 'stable') {
    await exec('rustup', ['toolchain', 'install', version]);
    await exec('rustup', ['default', version]);
}

async function installWasmPack() {
    const script = await downloadTool('https://rustwasm.github.io/wasm-pack/installer/init.sh');
    await exec('sh', [script]);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
