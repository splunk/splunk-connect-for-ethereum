import { EthereumClient } from './eth/client';
import { clientVersion } from './eth/requests';
import { createModuleDebug } from './utils/debug';
import { VendorNodeAdapter } from './vendors';
import { GenericNodeAdapter } from './vendors/generic';
import { GethAdapter } from './vendors/geth';
import { ParityAdapter } from './vendors/parity';
import { QuorumAdapter } from './vendors/quorum';

const { debug, info, error } = createModuleDebug('introspect');

export function createNodeAdapter(eth: EthereumClient, version: string): VendorNodeAdapter {
    if (version.startsWith('Geth/')) {
        debug('Detected geth node');
        if (version.includes('quorum')) {
            debug('Found "quorum" in version string - using Quroum adapter');
            const adapter = new QuorumAdapter(version);
            return adapter;
        } else {
            const adapter = new GethAdapter(version);
            return adapter;
        }
    }
    if (version.startsWith('Parity//')) {
        debug('Detected parity node');
        return new ParityAdapter(version);
    }
    debug('No specific support for given node type, falling bakc to generic adapter');
    return new GenericNodeAdapter(version);
}

export async function introspectTargetNode(eth: EthereumClient): Promise<VendorNodeAdapter> {
    debug(`Introspecting target ethereum node`);
    const version = await eth.request(clientVersion());
    info('Retrieved ethereum node version: %s', version);

    const adapter = createNodeAdapter(eth, version);
    if (typeof adapter.initialize === 'function') {
        debug('Initializing node vendor adatper: %s', adapter.name);
        try {
            await adapter.initialize(eth);
        } catch (e) {
            error('Failed to initialize node vendor adapter:', e);
            throw new Error(`Failed initialize node vendor adapter ${adapter.name}`);
        }
    }
    return adapter;
}
