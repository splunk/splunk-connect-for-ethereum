import { NodePlatformAdapter } from '.';
import { EthereumClient } from '../eth/client';
import { parityEnode, parityMode, parityNodeKind, clientVersion } from '../eth/requests';
import { createModuleDebug } from '../utils/debug';
import { NodeInfo } from '../msgs';
import { fetchDefaultNodeInfo, captureDefaultMetrics } from './generic';
import { ParityMode, ParityNodeKind } from '../eth/responses';

const { debug } = createModuleDebug('platforms:parity');

// TODO - this is a work in progress

export interface ParityNodeInfo extends NodeInfo {
    mode: ParityMode | null;
    nodeKind: ParityNodeKind | null;
}

export class ParityAdapter implements NodePlatformAdapter {
    public readonly fullVersion: string;
    private nodeInfo?: ParityNodeInfo;

    constructor(private clientVersion: string, private network?: string) {
        this.fullVersion = clientVersion;
    }

    public async initialize(ethClient: EthereumClient) {
        debug('Requesting parity internal info');
        await this.captureNodeInfo(ethClient);
    }

    public async captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo> {
        const [defaultNodeInfo, version, enode, mode, nodeKind] = await Promise.all([
            fetchDefaultNodeInfo(ethClient),
            ethClient.request(clientVersion()),
            ethClient.request(parityEnode()),
            ethClient.request(parityMode()),
            ethClient.request(parityNodeKind()),
        ]);

        this.nodeInfo = {
            enode,
            platform: this.name,
            clientVersion: version,
            network: this.network ?? null,
            networkId: defaultNodeInfo.networkId ?? null,
            protocolVersion: defaultNodeInfo.protocolVersion ?? null,
            transport: ethClient.transport.source,
            mode: mode as ParityMode,
            nodeKind: nodeKind,
        };
        return this.nodeInfo;
    }

    public get name(): string {
        return 'Parity';
    }

    public get enode(): string | null {
        return this.nodeInfo?.enode ?? null;
    }

    public get networkId(): number | null {
        return this.nodeInfo?.networkId ?? null;
    }

    public get protocolVersion(): number | null {
        return this.nodeInfo?.protocolVersion ?? null;
    }

    public async captureNodeStats(eth: EthereumClient, captureTime: number) {
        // TODO
        return [await captureDefaultMetrics(eth, captureTime)];
    }
}
