import { VendorNodeAdapter } from '.';
import { EthereumClient } from '../eth/client';
import { createModuleDebug } from '../utils/debug';
import { gethNodeInfo } from '../eth/requests';
import { GethNodeInfo } from '../eth/responses';

const { debug } = createModuleDebug('vendors:geth');

export class GethAdapter implements VendorNodeAdapter {
    public readonly fullVersion: string;
    protected nodeInfo?: GethNodeInfo;

    constructor(clientVersion: string) {
        this.fullVersion = clientVersion;
    }

    public async initialize(ethClient: EthereumClient) {
        debug('Retrieving nodeInfo from geth node');
        const [nodeInfo] = await Promise.all([ethClient.request(gethNodeInfo())]);
        debug('Retrieved node info: %O', nodeInfo);
        this.nodeInfo = nodeInfo;
    }

    public get name(): string {
        return 'Geth';
    }

    public get enode(): string | null {
        return this.nodeInfo?.enode || null;
    }

    public async captureNodeStats() {
        return [];
    }
}
