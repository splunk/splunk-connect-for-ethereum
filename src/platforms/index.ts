import { OutputMessage } from '../output';
import { EthereumClient } from '../eth/client';
import { NodeInfo, NodeMetricsMessage } from '../msgs';

/** Generic interface to capture platform-specific metrics and data from nodes */
export interface NodePlatformAdapter {
    readonly name: string;
    readonly fullVersion: string;
    readonly enode: string | null;
    readonly networkId: number | null;
    readonly networkName: string | null;
    readonly chainId: number | null;
    readonly chainName: string | null;
    readonly protocolVersion: number | null;
    initialize?(ethClient: EthereumClient): Promise<void>;
    captureNodeMetrics(
        ethClient: EthereumClient,
        captureTime: number
    ): Promise<NodeMetricsMessage[] | NodeMetricsMessage>;
    captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo>;
    capturePendingTransactions(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]>;
    supportsPendingTransactions(ethClient: EthereumClient): Promise<boolean>;
}
