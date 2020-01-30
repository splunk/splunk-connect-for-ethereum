import { NodePlatformAdapter } from '.';
import { EthereumClient } from '../eth/client';
import { KNOWN_NETOWORK_NAMES } from '../eth/networks';
import { clientVersion, gethMemStats, gethMetrics, gethNodeInfo, gethPeers, gethTxpool } from '../eth/requests';
import { GethMemStats, GethMetrics, GethNodeInfoResponse, GethPeer } from '../eth/responses';
import { formatPendingTransaction } from '../format';
import { NodeInfo, PendingTransactionMessage } from '../msgs';
import { OutputMessage } from '../output';
import { createModuleDebug } from '../utils/debug';
import { durationStringToMs, parseAbbreviatedNumber } from '../utils/parse';
import { captureDefaultMetrics, fetchDefaultNodeInfo } from './generic';

const { debug, error } = createModuleDebug('platforms:geth');

type MetricsObj = { [k: string]: number | string | any[] | MetricsObj };

const uncapitalize = (s: string): string => s[0].toLowerCase() + s.slice(1);

function formatGenericMetrics(obj: MetricsObj, prefix: string): Array<{ name: string; value: number }> {
    return Object.entries(obj).flatMap(([name, value]) => {
        if (typeof value === 'number') {
            return { name: `${prefix}.${uncapitalize(name)}`, value };
        }
        if (typeof value === 'string') {
            // Check if value is in the form of "0 (0.00/s)" and parse the first value (and exclude the per-second rate)
            if (value.endsWith(')')) {
                const parts = value.split(' ');
                if (parts.length === 2) {
                    const n = parseAbbreviatedNumber(parts[0]);
                    if (n != null && !isNaN(n)) {
                        return { name: `${prefix}.${uncapitalize(name)}`, value: n };
                    }
                }
            }
            if (value.endsWith('s')) {
                const dur = durationStringToMs(value);
                if (!isNaN(dur)) {
                    return { name: `${prefix}.${uncapitalize(name)}`, value: dur };
                }
            }
        }
        if (Array.isArray(value)) {
            return [];
        }
        if (typeof obj === 'object') {
            return formatGenericMetrics(value as MetricsObj, `${prefix}.${uncapitalize(name)}`);
        }
        return [];
    });
}

export function formatGethMetrics(metrics: GethMetrics): [string, number | undefined][] {
    return formatGenericMetrics(metrics, 'geth.metrics').map(({ name, value }) => [name, value]);
}

export function formatGethMemStats(memStats: GethMemStats): [string, number | undefined][] {
    const prefix = 'geth.memStats.';
    const { BySize: bySize, ...rest } = memStats;
    return Object.entries(rest)
        .filter(([, v]) => typeof v === 'number')
        .map(([name, value]) => [prefix + uncapitalize(name), value] as [string, number | undefined])
        .concat(
            bySize != null
                ? bySize.flatMap(s => [
                      [`${prefix}bySize.${s.Size}.mallocs`, s.Mallocs],
                      [`${prefix}bySize.${s.Size}.frees`, s.Frees],
                  ])
                : []
        );
}

export async function captureGethMetrics(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    const [metricsResults, memStatsResults] = await Promise.all([
        ethClient.request(gethMetrics(true)),
        ethClient.request(gethMemStats()),
    ]);
    return [
        {
            type: 'nodeMetrics',
            time: captureTime,
            metrics: Object.fromEntries([...formatGethMetrics(metricsResults), ...formatGethMemStats(memStatsResults)]),
        },
    ];
}

export async function captureTxpoolData(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    try {
        const txpool = await ethClient.request(gethTxpool());
        const pending = Object.values(txpool.pending).flatMap(o => Object.values(o).flat(1));
        const queued = Object.values(txpool.queued).flatMap(o => Object.values(o).flat(1));
        return [
            {
                type: 'nodeMetrics',
                time: captureTime,
                metrics: {
                    pendingTransactionCount: pending.length,
                    'geth.txpool.pending': pending.length,
                    'geth.txpool.queued': queued.length,
                },
            },
            ...pending.map(
                tx =>
                    ({
                        type: 'pendingtx',
                        time: captureTime,
                        body: formatPendingTransaction(tx, 'pending'),
                    } as PendingTransactionMessage)
            ),
            ...queued.map(
                tx =>
                    ({
                        type: 'pendingtx',
                        time: captureTime,
                        body: formatPendingTransaction(tx, 'queued'),
                    } as PendingTransactionMessage)
            ),
        ];
    } catch (e) {
        error('Failed to retrive txpool data from geth node', e);
        return [];
    }
}

export async function capturePeers(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    const peers = await ethClient.request(gethPeers());
    return peers.map((peer: GethPeer) => ({
        type: 'gethPeer',
        time: captureTime,
        body: peer,
    }));
}

export interface GethNodeInfo extends NodeInfo {
    gethInfo: GethNodeInfoResponse;
}

export class GethAdapter implements NodePlatformAdapter {
    protected gethNodeInfo?: GethNodeInfoResponse;
    protected nodeInfo?: GethNodeInfo;

    constructor(protected clientVersion: string, private network?: string) {}

    public async initialize(ethClient: EthereumClient) {
        await this.captureNodeInfo(ethClient);
    }

    public async captureNodeInfo(ethClient: EthereumClient): Promise<NodeInfo> {
        debug('Retrieving nodeInfo from geth node');
        const [nodeInfo, defaultNodeInfo, clientVersionRes] = await Promise.all([
            ethClient.request(gethNodeInfo()),
            fetchDefaultNodeInfo(ethClient),
            ethClient.request(clientVersion()),
        ]);
        debug('Retrieved node info: %O', nodeInfo);
        debug('Retrieved generic node info: %O', defaultNodeInfo);

        this.nodeInfo = {
            enode: nodeInfo.enode,
            clientVersion: clientVersionRes,
            network: this.network ?? null,
            networkId: defaultNodeInfo.networkId ?? null,
            platform: this.name,
            protocolVersion: defaultNodeInfo.protocolVersion ?? null,
            transport: ethClient.transport.source,
            gethInfo: nodeInfo,
        };
        return this.nodeInfo;
    }

    public get fullVersion(): string {
        return this.nodeInfo?.clientVersion ?? this.clientVersion;
    }

    public get name(): string {
        return 'geth';
    }

    public get enode(): string | null {
        return this.nodeInfo?.enode ?? null;
    }

    public get networkId(): number | null {
        return this.nodeInfo?.networkId ?? null;
    }

    public get protocolVersion(): number | null {
        return this.nodeInfo?.protocolVersion ?? null;
    }

    public get networkName(): string | null {
        return this.network ?? (this.networkId != null ? KNOWN_NETOWORK_NAMES[this.networkId] : null) ?? null;
    }

    public async captureNodeStats(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
        const [defaultMetrics, getMetrics, txpoolData] = await Promise.all([
            captureDefaultMetrics(ethClient, captureTime),
            captureGethMetrics(ethClient, captureTime),
            captureTxpoolData(ethClient, captureTime),
            capturePeers(ethClient, captureTime),
        ]);
        return [defaultMetrics, ...getMetrics, ...txpoolData];
    }
}
