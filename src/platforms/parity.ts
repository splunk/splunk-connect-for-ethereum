import { EthereumClient } from '../eth/client';
import { parityEnode, parityMode, parityNodeKind } from '../eth/requests';
import { ParityMode, ParityNodeKind } from '../eth/responses';
import { NodeInfo } from '../msgs';
import { GenericNodeAdapter } from './generic';

// TODO - this is a work in progress

export interface ParityNodeInfo extends NodeInfo {
    mode: ParityMode | null;
    nodeKind: ParityNodeKind | null;
}

export class ParityAdapter extends GenericNodeAdapter {
    public async initialize(ethClient: EthereumClient) {
        await super.initialize(ethClient);
    }

    public async captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo> {
        const [baseNodeInfo, enode, mode, nodeKind] = await Promise.all([
            super.captureNodeInfo(ethClient),
            ethClient.request(parityEnode()),
            ethClient.request(parityMode()),
            ethClient.request(parityNodeKind()),
        ]);

        return {
            ...baseNodeInfo,
            enode,
            platform: this.name,
            mode: (mode as ParityMode) ?? null,
            nodeKind: nodeKind ?? null,
        };
    }

    public get name(): string {
        return 'parity';
    }

    public get enode(): string | null {
        return this.nodeInfo?.enode ?? null;
    }
}
