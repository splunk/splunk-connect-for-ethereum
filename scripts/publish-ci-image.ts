/* eslint-disable no-console */
import execa from 'execa';
import { join } from 'path';

const IMAGE = 'splunkdlt/scfe-ci';

async function main() {
    const img = `${IMAGE}:latest`;
    console.log('Building', img);
    await execa('docker', ['build', '-t', img, '.', '-f', 'Dockerfile-ci'], {
        stdio: 'inherit',
        cwd: join(__dirname, '../ci'),
    });

    console.log('Pushing', img);
    await execa('docker', ['push', img], { stdio: 'inherit' });
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
