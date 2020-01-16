import { EthereumClient } from '../eth/client';
import {
    quorumIstanbulCandidates,
    quorumRaftCluster,
    quorumRaftLeader,
    quorumRaftRole,
    quroumIstanbulSnapshot,
} from '../eth/requests';
import { QuorumProtocolInfo } from '../msgs';
import { createModuleDebug } from '../utils/debug';
import { GethAdapter } from './geth';

const { debug, warn } = createModuleDebug('platforms:quorum');

export type QUORUM_CONSENSUS = 'istanbul' | 'raft';

export async function captureIstanbulData(ethClient: EthereumClient): Promise<QuorumProtocolInfo> {
    debug('Capturing istanbul data from quorum node');
    const [snapshot, candidates] = await Promise.all([
        ethClient.request(quroumIstanbulSnapshot()),
        ethClient.request(quorumIstanbulCandidates()),
    ]);
    return {
        consensusMechanism: 'istanbul',
        snapshot,
        candidates,
    };
}

export async function captureRaftData(ethClient: EthereumClient): Promise<QuorumProtocolInfo> {
    debug('Capturing raft data from quorum node');
    const [role, leader, cluster] = await Promise.all([
        ethClient.request(quorumRaftRole()),
        ethClient.request(quorumRaftLeader()),
        ethClient.request(quorumRaftCluster()),
    ]);
    return {
        consensusMechanism: 'raft',
        role,
        leader,
        cluster,
    };
}

export class QuorumAdapter extends GethAdapter {
    private consensus: 'istanbul' | 'raft' | null = null;
    public async initialize(ethClient: EthereumClient) {
        await super.initialize(ethClient);
        debug('Attempting to determine quorum consenus mechanism');
        if ('istanbul' in (this.nodeInfo?.gethInfo?.protocols ?? {})) {
            this.consensus = 'istanbul';
        } else {
            try {
                const raftInfo = await captureRaftData(ethClient);
                debug('Successfully retrieved raft data from node: %o, assuming consensus mechanism is raft', raftInfo);
                this.consensus = 'raft';
            } catch (e) {
                warn(
                    'Unable to determine quorum consensus mechanism by inspecting nodeInfo protocols: %o',
                    this.gethNodeInfo?.protocols
                );
            }
        }
    }

    public async captureNodeInfo(ethClient: EthereumClient) {
        const gethResult = await super.captureNodeInfo(ethClient);
        const quorumProtocol =
            this.consensus === 'istanbul'
                ? await captureIstanbulData(ethClient)
                : this.consensus === 'raft'
                ? await captureRaftData(ethClient)
                : undefined;
        return {
            ...gethResult,
            name: this.name,
            quorumProtocol,
        };
    }

    public get name() {
        return this.consensus == null ? 'quorum' : `quorum:${this.consensus}`;
    }
}
