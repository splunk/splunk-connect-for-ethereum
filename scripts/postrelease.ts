/* eslint-disable no-console */
import fetch from 'node-fetch';
import execa from 'execa';
import { parse as parseSemver, rcompare } from 'semver';

const DOCKER_IMAGE = 'docker.pkg.github.com/splunk/splunk-connect-for-ethereum/ethlogger';
const NPM_PACKAGE = '@splunk/splunk-connect-for-ethereum';

async function pullDockerImage(commitSHA: string) {
    const img = `${DOCKER_IMAGE}:${commitSHA}`;
    console.log('Pulling', img);
    for (let attempt = 1; attempt < 25; attempt++) {
        try {
            await execa('docker', ['pull', img], { stdio: 'inherit' });
            return;
        } catch (e) {
            console.error(`Failed to pull docker image: ${e}`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    throw new Error(`Failed to pull docker image ${img}`);
}

async function tagAndPushDockerImage(commitSHA: string, tag: string) {
    console.log('Creating image tag', commitSHA, '->', tag);
    await execa('docker', ['tag', `${DOCKER_IMAGE}:${commitSHA}`, `${DOCKER_IMAGE}:${tag}`]);
    console.log('Pushing', `${DOCKER_IMAGE}:${tag}`);
    await execa('docker', ['push', `${DOCKER_IMAGE}:${tag}`]);
}

export async function main(args: string[]) {
    let tag = args[0];

    if (tag == null) {
        throw new Error('Missing tag from argument list');
    }

    if (tag.startsWith('refs/tags/')) {
        tag = tag.slice('refs/tags/'.length);
    }

    if (tag == null || !(tag[0] == 'v')) {
        throw new Error(`Invalid tag ${tag}`);
    }

    const semver = parseSemver(tag);

    if (semver == null) {
        throw new Error(`Unable to parse version tag ${tag}`);
    }

    const commitSHA = (await execa('git', ['rev-parse', tag])).stdout;
    console.log(`Resolved tag ${tag} to commit SHA ${commitSHA}`);

    await pullDockerImage(commitSHA);
    await tagAndPushDockerImage(commitSHA, semver.version);
    if (!semver.prerelease?.length) {
        await tagAndPushDockerImage(commitSHA, `${semver.major}.${semver.minor}`);
        await tagAndPushDockerImage(commitSHA, String(semver.major));
        const allTags = (await execa('git', ['tag', '--list', 'v*'])).stdout.split('\n');
        allTags.sort(rcompare);
        if (tag === allTags[0]) {
            console.log(`${tag} is the latest release`);
            await tagAndPushDockerImage(commitSHA, 'latest');
        }
    }

    const releaseInfo = await fetch(
        `https://api.github.com/repos/splunk/splunk-connect-for-ethereum/releases/tags/${encodeURIComponent(tag)}`,
        {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.everest-preview+json',
            },
        }
    ).then(res => res.json());

    const packageInfoMd = [
        '### Packages',
        '',
        `- Docker image [${DOCKER_IMAGE}:${
            semver.version
        }](https://github.com/splunk/splunk-connect-for-ethereum/packages/90723?version=${encodeURIComponent(
            semver.version
        )})`,
        `- NPM package [${NPM_PACKAGE}@${
            semver.version
        }](https://github.com/splunk/splunk-connect-for-ethereum/packages/97172?version=${encodeURIComponent(
            semver.version
        )})`,
    ].join('\n');

    const body: string = releaseInfo.body;
    const start = body.indexOf('<!-- PACKAGES -->');
    const end = body.indexOf('<!-- PACKAGES-END -->');

    const newBody =
        start < 0
            ? `${body}\n\n<!-- PACKAGES -->\n${packageInfoMd}\n<!-- PACKAGES-END -->`
            : [
                  body.slice(0, start),
                  '<!-- PACKAGES -->',
                  '\n',
                  packageInfoMd,
                  '\n',
                  end < 0 ? '' : body.slice(end),
              ].join('\n');

    console.log('Updating release description');

    await fetch(releaseInfo.url, {
        method: 'PATCH',
        headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.everest-preview+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: newBody }),
    });
}

main(process.argv.slice(2)).catch(e => {
    console.error(e);
    process.exit(1);
});
