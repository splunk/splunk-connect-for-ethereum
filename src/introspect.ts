import { EthereumClient } from './eth/client';
import { clientVersion } from './eth/requests';
import { createModuleDebug } from './utils/debug';
import { NodePlatformAdapter } from './platforms';
import { GenericNodeAdapter } from './platforms/generic';
import { GethAdapter } from './platforms/geth';
import { ParityAdapter } from './platforms/parity';
import { QuorumAdapter } from './platforms/quorum';
import { retry, linearBackoff } from './utils/retry';

const { debug, info, error } = createModuleDebug('introspect');

export function createNodeAdapter(version: string, chain?: string, network?: string): NodePlatformAdapter {
    if (version.startsWith('Geth/')) {
        debug('Detected geth node');
        if (version.includes('quorum')) {
            debug('Found "quorum" in version string - using Quroum adapter');
            const adapter = new QuorumAdapter(version, chain, network);
            return adapter;
        } else {
            const adapter = new GethAdapter(version, chain, network);
            return adapter;
        }
    }
    if (version.startsWith('Parity//') || version.startsWith('Parity-Ethereum//')) {
        debug('Detected parity node');
        return new ParityAdapter(version, chain, network);
    }
    debug('No specific support for given node type, falling bakc to generic adapter');
    return new GenericNodeAdapter(version, chain, network);
}

export async function introspectTargetNodePlatform(
    eth: EthereumClient,
    chain?: string,
    network?: string
): Promise<NodePlatformAdapter> {
    info(`Introspecting target ethereum node at %s`, eth.transport.source);
    const version = await retry(() => eth.request(clientVersion()), {
        attempts: 100,
        taskName: 'determine eth node client version',
        waitBetween: linearBackoff({ min: 1000, step: 500, max: 30_000 }),
        warnOnError: true,
    }).catch(e => {
        error('Failed to detrmine target node platform', e);
        throw new Error('Failed to determine target node platform');
    });
    info('Retrieved ethereum node version: %s', version);

    let adapter = createNodeAdapter(version, chain, network);
    if (typeof adapter.initialize === 'function') {
        debug('Initializing node platform adatper: %s', adapter.name);
        try {
            await adapter.initialize(eth);
        } catch (e) {
            error('Failed to initialize node platform adapter:', e);

            try {
                adapter = new GenericNodeAdapter(version, chain, network);
                info('Attempting to use generic node platform adapter: %s', adapter.name);
                if (typeof adapter.initialize === 'function') {
                    await adapter.initialize(eth);
                }
                return adapter;
            } catch (e) {
                error('Failed to initialize generic node platform adapter:', e);
            }
            throw new Error(`Failed initialize node platform adapter ${adapter.name}`);
        }
    }
    return adapter;
}
