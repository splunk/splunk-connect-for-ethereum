import { VendorNodeAdapter } from '.';
import { createModuleDebug } from '../utils/debug';

const { debug } = createModuleDebug('vendors:generic');

export class GenericNodeAdapter implements VendorNodeAdapter {
    public readonly fullVersion: string;
    private extractedName: string | null = 'Generic:unknown';
    public enode = null;
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

    public async captureNodeStats() {
        return [];
    }
}
