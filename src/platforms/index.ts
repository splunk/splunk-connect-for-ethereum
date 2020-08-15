import { EthereumClient } from '../eth/client';
import { RawTransactionResponse } from '../eth/responses';
import { NodeInfo, NodeMetricsMessage } from '../msgs';
import { OutputMessage } from '../output';

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
    capturePeerInfo?(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]>;
    supportsPeerInfo(ethClient: EthereumClient): Promise<boolean>;
}

export interface EnterpriseNodePlatformAdapter extends NodePlatformAdapter {
    supportsPrivateTransactions(): boolean;
    isPrivateTransaction(tx: RawTransactionResponse): boolean;
    getRawTransactionInput(input: string, ethClient: EthereumClient): Promise<string>;
}

export function isEnterprisePlatform(platform: NodePlatformAdapter): platform is EnterpriseNodePlatformAdapter {
    return typeof (platform as any).supportsPrivateTransactions === 'function';
}
