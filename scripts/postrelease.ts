/* eslint-disable no-console */
import fetch from 'node-fetch';
import execa from 'execa';
import { parse as parseSemver, rcompare } from 'semver';

const GITHUB_DOCKER_IMAGE = 'docker.pkg.github.com/splunk/splunk-connect-for-ethereum/ethlogger';
const DOCKER_HUB_IMAGE = 'splunkdlt/ethlogger';
const NPM_PACKAGE = '@splunk/splunk-connect-for-ethereum';

async function obtainCurrentDockerImage(commitSHA: string, allowBuild: boolean = false) {
    const img = `${GITHUB_DOCKER_IMAGE}:${commitSHA}`;

    try {
        await execa('docker', ['pull', img]);
        console.log(`Successfully pulled image ${img} from docker registry, skipping build`);
        return;
    } catch (e) {
        // ignore
    }
    if (!allowBuild) {
        throw new Error(`Unable to obtain docker image for commit SHA ${commitSHA}`);
    }
    console.log('Building', img);
    await execa('docker', ['build', '-t', img, '.'], { stdio: 'inherit' });
    await execa('docker', ['push', img], { stdio: 'inherit' });
}

async function tagAndPushDockerImage(dockerImage: string, commitSHA: string, tag: string) {
    console.log('Creating image tag', commitSHA, '->', tag);
    await execa('docker', ['tag', `${GITHUB_DOCKER_IMAGE}:${commitSHA}`, `${dockerImage}:${tag}`]);
    console.log('Pushing', `${dockerImage}:${tag}`);
    await execa('docker', ['push', `${dockerImage}:${tag}`]);
}

function latestVersion(tags: string[]): string {
    const sorted = [...tags].sort(rcompare);
    return sorted[0];
}

export async function main(args: string[]) {
    let tagIsHead = false;
    let tag = args[0];
    if (tag == null) {
        const tags = (await execa('git', ['tag', '-l', '--points-at', 'HEAD'])).stdout
            .split('\n')
            .filter(t => t.startsWith('v'));

        if (tags.length === 0) {
            console.log('HEAD is not tagged with a new version. Skipping post-release.');
            return;
        }

        if (tags.length > 1) {
            console.log('WARNING: HEAD was tagged with multiple v* tags. Using first one.');
        }

        tag = latestVersion(tags);
        tagIsHead = true;
    }

    if (tag == null || !(tag[0] == 'v')) {
        throw new Error(`Invalid tag ${tag}`);
    }

    const semver = parseSemver(tag);

    if (semver == null) {
        throw new Error(`Unable to parse version tag ${tag}`);
    }

    const commitSHA = (await execa('git', ['rev-parse', tag])).stdout;
    console.log(`Performing post-release steps for tag ${tag}\nVersion: ${semver.version}\nCommit SHA: ${commitSHA})`);

    await obtainCurrentDockerImage(commitSHA, tagIsHead);
    const publishImageVersions = async (targetImage: string) => {
        console.log('Publishing', targetImage);
        await tagAndPushDockerImage(targetImage, commitSHA, semver.version);
        if (!semver.prerelease?.length) {
            await tagAndPushDockerImage(targetImage, commitSHA, `${semver.major}.${semver.minor}`);
            await tagAndPushDockerImage(targetImage, commitSHA, String(semver.major));
            const allTags = (await execa('git', ['tag', '--list', 'v*'])).stdout.split('\n');
            if (tag === latestVersion(allTags)) {
                console.log(`${tag} is the latest release`);
                await tagAndPushDockerImage(targetImage, commitSHA, 'latest');
            }
        }
    };
    await publishImageVersions(GITHUB_DOCKER_IMAGE);
    if (process.env.DOCKER_HUB_TOKEN) {
        console.log('Logging in to docker hub');
        await execa('docker', ['login', '-u', 'dltbuilder', '-p', process.env.DOCKER_HUB_TOKEN]);
        await publishImageVersions(DOCKER_HUB_IMAGE);
    } else {
        console.log('No docker hub token set. Skipping publish to docker hub.');
    }

    const bullet = (prefix: string, title: string, href: string) => `- ${prefix}: [${title}](${href})`;
    const packageInfoMd = [
        '### Packages',
        '',
        bullet(
            'Docker image',
            `${GITHUB_DOCKER_IMAGE}:${semver.version}`,
            `https://github.com/splunk/splunk-connect-for-ethereum/packages/90723?version=${encodeURIComponent(
                semver.version
            )}`
        ),
        bullet(
            'NPM package',
            `${NPM_PACKAGE}@${semver.version}`,
            `https://github.com/splunk/splunk-connect-for-ethereum/packages/97172?version=${encodeURIComponent(
                semver.version
            )}`
        ),
        process.env.DOCKER_HUB_TOKEN != null
            ? bullet(
                  'Docker image on docker hub',
                  `${DOCKER_HUB_IMAGE}:${semver.version}`,
                  'https://hub.docker.com/r/splunkdlt/ethlogger'
              )
            : '',
    ].join('\n');

    const releaseInfo = await fetch(
        `https://api.github.com/repos/splunk/splunk-connect-for-ethereum/releases/tags/${encodeURIComponent(tag)}`,
        {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.everest-preview+json',
            },
        }
    ).then(res =>
        res.status > 299
            ? Promise.reject(new Error(`Failed to fetch release info: HTTP status ${res.status}`))
            : res.json()
    );

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
