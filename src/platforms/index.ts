import { OutputMessage } from '../output';
import { EthereumClient } from '../eth/client';
import { NodeInfo } from '../msgs';

/** Generic interface to capture platform-specific metrics and data from nodes */
export interface NodePlatformAdapter {
    readonly name: string;
    readonly fullVersion: string;
    readonly enode: string | null;
    readonly networkId: number | null;
    readonly protocolVersion: number | null;
    readonly networkName: string | null;
    initialize?(ethClient: EthereumClient): Promise<void>;
    captureNodeStats(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]>;
    captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo>;
}
