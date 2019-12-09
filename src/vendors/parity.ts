import { VendorNodeAdapter } from '.';
import { EthereumClient } from '../eth/client';
import { parityEnode } from '../eth/requests';
import { createModuleDebug } from '../utils/debug';

const { debug } = createModuleDebug('vendors:parity');

export class ParityAdapter implements VendorNodeAdapter {
    public readonly fullVersion: string;
    public enode: string | null = null;

    constructor(clientVersion: string) {
        this.fullVersion = clientVersion;
    }

    async initialize(ethClient: EthereumClient) {
        debug('Requesting parity internal info');
        const [enode] = await Promise.all([ethClient.request(parityEnode())]);
        this.enode = enode;
    }

    public get name(): string {
        return 'Parity';
    }

    public async captureNodeStats() {
        // TODO
        return [];
    }
}
