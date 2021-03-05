/* eslint-disable no-console */
import execa from 'execa';
import { join } from 'path';
import { readFile, writeFile } from 'fs-extra';

const IMAGE = 'ghcr.io/splunkdlt/connect-ci';

const getImageWithSha = async (img: string): Promise<string> => {
    const { stdout } = await execa('docker', ['inspect', '--format={{index .RepoDigests 0}}', img]);
    return stdout;
};

const replaceImageInFile = async (filePath: string, img: string) => {
    const contents = await readFile(filePath, { encoding: 'utf-8' });
    const updatedContents = contents.replace(/(ghcr\.io\/)?splunkdlt\/(scfe-ci|connect-ci)@sha256:\w+/g, img);
    if (updatedContents !== contents) {
        console.log(`Replaced docker image reference in file ${filePath}`);
        await writeFile(filePath, updatedContents, { encoding: 'utf-8' });
    }
};

async function main() {
    const img = `${IMAGE}:latest`;
    console.log('Building', img);
    await execa('docker', ['build', '-t', img, '.', '-f', 'Dockerfile-ci'], {
        stdio: 'inherit',
        cwd: join(__dirname, '../ci'),
    });

    console.log('Pushing', img);
    await execa('docker', ['push', img], { stdio: 'inherit' });
    const fqImage = await getImageWithSha(img);
    console.log(`Latest image SHA is ${fqImage}`);
    await replaceImageInFile(join(__dirname, '../Dockerfile'), fqImage);
    await replaceImageInFile(join(__dirname, '../.github/workflows/ci.yaml'), fqImage);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
