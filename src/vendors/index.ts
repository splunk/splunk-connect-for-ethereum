import { OutputMessage } from '../output';
import { EthereumClient } from '../eth/client';

/** Generic interface to capture vendor-specific metrics and data from nodes */
export interface VendorNodeAdapter {
    readonly name: string;
    readonly fullVersion: string;
    readonly enode: string | null;

    initialize?(ethClient: EthereumClient): Promise<void>;

    captureNodeStats(ethClient: EthereumClient): Promise<OutputMessage[]>;
}
