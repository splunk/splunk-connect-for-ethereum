import { NodePlatformAdapter } from '.';
import { createModuleDebug } from '../utils/debug';
import { EthereumClient } from '../eth/client';
import { OutputMessage } from '../output';
import { hashRate, peerCount, gasPrice } from '../eth/requests';
import { bigIntToNumber } from '../utils/bn';

const { debug, warn } = createModuleDebug('platforms:generic');

export async function captureDefaultMetrics(eth: EthereumClient, captureTime: number): Promise<OutputMessage> {
    const metrics: Array<[string, number] | null> = await Promise.all([
        eth.request(hashRate()).then(value => ['hashRate', value]),
        eth.request(peerCount()).then(value => ['peerCount', value]),
        eth.request(gasPrice()).then(
            value => ['gasPrice', bigIntToNumber(value)],
            e => {
                warn('Error obtaining gas price: %s', e.message);
                return null;
            }
        ),
    ]);
    return {
        type: 'nodeMetrics',
        time: captureTime,
        metrics: Object.fromEntries(metrics.filter(m => m != null) as Array<[string, number]>),
    };
}

export class GenericNodeAdapter implements NodePlatformAdapter {
    public readonly fullVersion: string;
    private extractedName: string | null = 'generic:unknown';

    constructor(clientVersion: string) {
        this.fullVersion = clientVersion;
        if (clientVersion.includes('/')) {
            const name = clientVersion.slice(0, clientVersion.indexOf('/'));
            debug('Extracted ethereum node name %o from clientVersion response', name);
            this.extractedName = name;
        }
    }

    public get name(): string {
        return this.extractedName != null ? `generic:${this.extractedName}` : `generic:unknown`;
    }

    public get enode(): string | null {
        return null;
    }

    public async captureNodeStats(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
        return [await captureDefaultMetrics(ethClient, captureTime)];
    }
}
