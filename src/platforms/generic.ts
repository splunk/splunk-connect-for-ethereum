import { NodePlatformAdapter } from '.';
import { createModuleDebug } from '../utils/debug';
import { EthereumClient } from '../eth/client';
import { OutputMessage } from '../output';
import { hashRate, peerCount, gasPrice } from '../eth/requests';
import { bigIntToNumber } from '../utils/bn';

const { debug, warn } = createModuleDebug('platforms:generic');

export async function captureDefaultMetrics(eth: EthereumClient, captureTime: number): Promise<OutputMessage> {
    const metrics: Array<{ name: string; value: number } | null> = await Promise.all([
        eth.request(hashRate()).then(value => ({ name: 'hashRate', value })),
        eth.request(peerCount()).then(value => ({ name: 'peerCount', value })),
        eth.request(gasPrice()).then(
            value => ({ name: 'gasPrice', value: bigIntToNumber(value) }),
            e => {
                warn('Error obtaining gas price: %s', e.message);
                return null;
            }
        ),
    ]);
    return {
        type: 'node:metrics',
        time: captureTime,
        metrics: metrics.filter(m => m != null) as Array<{ name: string; value: number }>,
    };
}

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
        return [await captureDefaultMetrics(ethClient, captureTime)];
    }
}
