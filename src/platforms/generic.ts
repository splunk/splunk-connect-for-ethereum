import { NodePlatformAdapter } from '.';
import { createModuleDebug } from '../utils/debug';
import { EthereumClient } from '../eth/client';
import { OutputMessage } from '../output';

const { debug } = createModuleDebug('platforms:generic');

export class GenericNodeAdapter implements NodePlatformAdapter {
    public readonly fullVersion: string;
    private extractedName: string | null = 'Generic:unknown';

    constructor(clientVersion: string) {
        this.fullVersion = clientVersion;
        if (clientVersion.includes('/')) {
            const name = clientVersion.slice(0, clientVersion.indexOf('/'));
            debug('Extracted ethereum node name %o from clientVersion response', name);
            this.extractedName = name;
        }
    }

    public get name(): string {
        return this.extractedName != null ? `Generic:${this.extractedName}` : `Generic:unknown`;
    }

    public get enode(): string | null {
        return null;
    }

    public async captureNodeStats(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
        return [];
    }
}
