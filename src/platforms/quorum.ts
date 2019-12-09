import { createModuleDebug } from '../utils/debug';
import { GethAdapter } from './geth';
import { EthereumClient } from '../eth/client';

const { debug, warn } = createModuleDebug('platforms:quorum');

export type QUORUM_CONSENSUS = 'istanbul' | 'raft';

export class QuorumAdapter extends GethAdapter {
    private consensus: 'instanbul' | 'raft' | null = null;
    public async initialize(ethClient: EthereumClient) {
        await super.initialize(ethClient);

        debug('Attempting to determine quorum consenus mechanism');

        if ('istanbul' in (this.nodeInfo?.protocols || {})) {
            this.consensus = 'instanbul';
        } else {
            // TODO check for raft
            warn(
                'Unable to determine quorum consensus mechanism by inspecting nodeInfo protocols: %o',
                this.nodeInfo?.protocols
            );
        }
    }

    public get name() {
        return this.consensus == null ? 'Quorum' : `Quorum:${this.consensus}`;
    }
}
