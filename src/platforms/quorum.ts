import { createModuleDebug } from '../utils/debug';
import { GethAdapter } from './geth';
import { EthereumClient } from '../eth/client';
import { OutputMessage } from '../output';
import {
    quroumIstanbulSnapshot,
    quorumIstanbulCandidates,
    quorumRaftRole,
    quorumRaftLeader,
    quorumRaftCluster,
} from '../eth/requests';

const { debug, warn } = createModuleDebug('platforms:quorum');

export type QUORUM_CONSENSUS = 'istanbul' | 'raft';

export async function captureIstanbulData(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    debug('Capturing istanbul data from quorum node');
    const [snapshot, candidates] = await Promise.all([
        ethClient.request(quroumIstanbulSnapshot()),
        ethClient.request(quorumIstanbulCandidates()),
    ]);
    return [
        {
            type: 'quorumProtocol',
            time: captureTime,
            body: {
                consensusMechanism: 'istanbul',
                snapshot,
                candidates,
            },
        },
    ];
}

export async function captureRaftData(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    debug('Capturing raft data from quorum node');
    const [role, leader, cluster] = await Promise.all([
        ethClient.request(quorumRaftRole()),
        ethClient.request(quorumRaftLeader()),
        ethClient.request(quorumRaftCluster()),
    ]);
    return [
        {
            type: 'quorumProtocol',
            time: captureTime,
            body: {
                consensusMechanism: 'raft',
                role,
                leader,
                cluster,
            },
        },
    ];
}

export class QuorumAdapter extends GethAdapter {
    private consensus: 'istanbul' | 'raft' | null = null;
    public async initialize(ethClient: EthereumClient) {
        await super.initialize(ethClient);
        debug('Attempting to determine quorum consenus mechanism');
        if ('istanbul' in (this.nodeInfo?.gethInfo?.protocols ?? {})) {
            this.consensus = 'istanbul';
        } else {
            // TODO check for raft
            warn(
                'Unable to determine quorum consensus mechanism by inspecting nodeInfo protocols: %o',
                this.gethNodeInfo?.protocols
            );
        }
    }

    public async captureNodeInfo(ethClient: EthereumClient) {
        const gethResult = await super.captureNodeInfo(ethClient);
        return {
            ...gethResult,
            name: this.name,
            quorum: {
                consensus: this.consensus ?? null,
            },
        };
    }

    public get name() {
        return this.consensus == null ? 'quorum' : `quorum:${this.consensus}`;
    }

    public async captureNodeStats(ethClient: EthereumClient, captureTime: number) {
        const [baseGethMsgs, quorumProtocolMsgs] = await Promise.all([
            super.captureNodeStats(ethClient, captureTime),
            this.consensus === 'istanbul'
                ? captureIstanbulData(ethClient, captureTime)
                : this.consensus === 'raft'
                ? captureRaftData(ethClient, captureTime)
                : [],
        ]);
        return [...baseGethMsgs, ...quorumProtocolMsgs];
    }
}
