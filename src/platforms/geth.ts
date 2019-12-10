import { EthereumClient } from '../eth/client';
import { gethMemStats, gethMetrics, gethNodeInfo, gethTxpool } from '../eth/requests';
import { GethMemStats, GethMetrics, GethNodeInfo } from '../eth/responses';
import { OutputMessage } from '../output';
import { createModuleDebug } from '../utils/debug';
import { GenericNodeAdapter } from './generic';

const { debug } = createModuleDebug('platforms:geth');

type MetricsObj = { [k: string]: number | string | MetricsObj | any };

const ABBREVIATE_UNITS: { [k: string]: number } = {
    K: 1_000,
    M: 1_000_000,
    G: 1_000_000_000,
    T: 1_000_000_000_000,
};

export function parseAbbreviatedNumber(s: string): number {
    let rest = s;
    let factor = 1;
    const unitFactor = ABBREVIATE_UNITS[s[s.length - 1]];
    if (unitFactor != null) {
        rest = s.slice(0, -1);
        factor = unitFactor;
    }
    return parseFloat(rest) * factor;
}

/** Parses golang-formatted duration string */
export function durationStringToMs(dur: string): number {
    let millis = 0;
    let neg = false;
    const len = dur.length;
    let i = 0;
    if (dur[0] === '-') {
        neg = true;
        i++;
    } else if (dur[0] === '+') {
        i++;
    }
    while (i < len) {
        let j = i;
        do {
            const c = dur[j];
            if (!((c >= '0' && c <= '9') || c === '.')) {
                j++;
                break;
            }
        } while (++j < len);
        if (i === j) {
            // empty string
            return NaN;
        }
        const n = parseFloat(dur.slice(i, j - 1));
        if (isNaN(n)) {
            return NaN;
        }
        i = j - 1;
        const unitStr = dur.slice(i, i + 2);
        if (unitStr === 'ns') {
            millis += n / 1_000_000;
            i += 2;
        } else if (unitStr === 'us' || unitStr === 'µs' || unitStr === 'μs') {
            millis += n / 1_000;
            i += 2;
        } else if (unitStr === 'ms') {
            millis += n;
            i += 2;
        } else if (unitStr[0] === 's') {
            millis += n * 1_000;
            i += 1;
        } else if (unitStr[0] === 'm') {
            millis += n * 60_0000;
            i += 1;
        } else if (unitStr[0] === 'h') {
            millis += n * 360_000;
            i += 1;
        } else {
            // not a unit
            return NaN;
        }
    }
    return millis * (neg ? -1 : 1);
}

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
            return formatGenericMetrics(value, `${prefix}.${uncapitalize(name)}`);
        }
        return [];
    });
}

export function formatGethMetrics(metrics: GethMetrics): Array<{ name: string; value: number }> {
    return formatGenericMetrics(metrics, 'geth.metrics');
}

export function formatGethMemStats(memStats: GethMemStats): Array<{ name: string; value: number }> {
    const prefix = 'geth.memStats.';
    const { BySize: bySize, ...rest } = memStats;
    return Object.entries(rest)
        .filter(([, v]) => typeof v === 'number')
        .map(([name, value]) => ({
            name: prefix + uncapitalize(name),
            value,
        }))
        .concat(
            bySize != null
                ? bySize.flatMap(s => [
                      {
                          name: `${prefix}bySize.${s.Size}.mallocs`,
                          value: s.Mallocs,
                      },
                      {
                          name: `${prefix}bySize.${s.Size}.frees`,
                          value: s.Frees,
                      },
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
            type: 'node:metrics',
            time: captureTime,
            metrics: [...formatGethMetrics(metricsResults), ...formatGethMemStats(memStatsResults)],
        },
    ];
}

export async function captureTxpoolData(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
    const txpool = await ethClient.request(gethTxpool());
    const pending = Object.values(txpool.pending).flatMap(o => Object.values(o));
    const queued = Object.values(txpool.queued).flatMap(o => Object.values(o));
    return [
        {
            type: 'node:metrics',
            time: captureTime,
            metrics: [
                { name: 'geth.txpool.pending', value: pending.length },
                { name: 'geth.txpool.queued', value: queued.length },
            ],
        },
        // TODO: send messages for raw pending/queued transactions
    ];
}

export class GethAdapter extends GenericNodeAdapter {
    public readonly fullVersion: string;
    protected nodeInfo?: GethNodeInfo;

    constructor(clientVersion: string) {
        super(clientVersion);
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

    public async captureNodeStats(ethClient: EthereumClient, captureTime: number): Promise<OutputMessage[]> {
        const [metrics, txpool] = await Promise.all([
            captureGethMetrics(ethClient, captureTime),
            captureTxpoolData(ethClient, captureTime),
        ]);
        return [...metrics, ...txpool];
    }
}
