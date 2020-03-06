import { ManagedResource } from './resource';
import { HecClient } from '../hec';
import { AgentStatus } from 'agentkeepalive';
import { createModuleDebug } from './debug';
import { getWasmMemorySize } from '../abi/wasm';

const { debug } = createModuleDebug('utils:stats');

export interface Stats {
    [k: string]: number | Stats;
}

export interface StatsSource<S extends Stats> {
    flushStats(): S;
}

export type FlattenedStats = Array<{ name: string; value: number }>;

export function flatStats(m: Stats, prefix?: string): FlattenedStats {
    let result: FlattenedStats = [];
    for (const [name, value] of Object.entries(m)) {
        const fullName = prefix ? `${prefix}.${name}` : name;
        if (typeof value === 'number') {
            result.push({ name: fullName, value });
        } else {
            result = result.concat(flatStats(value, fullName));
        }
    }
    return result;
}

interface SourceHandle<S extends Stats> {
    source: StatsSource<S>;
    prefix?: string;
}

class SystemStats {
    private lastCpuUsage?: NodeJS.CpuUsage;
    public flushStats(): Stats {
        const mem = process.memoryUsage();
        const nextBaseUsage = process.cpuUsage();
        const cpu = process.cpuUsage(this.lastCpuUsage);
        this.lastCpuUsage = nextBaseUsage;
        return {
            mem: {
                ...mem,
            },
            cpu: {
                ...cpu,
            },
            wasm: {
                memorySize: getWasmMemorySize(),
            },
            uptime: process.uptime(),
        };
    }
}

export class InternalStatsCollector implements ManagedResource {
    private readonly sources: SourceHandle<Stats>[] = [];
    private active: boolean = true;
    private collectTimer: NodeJS.Timer | null = null;

    constructor(public config: { collect: boolean; collectInterval: number; dest: HecClient; basePrefix?: string }) {
        this.addSource(new SystemStats(), 'system');
    }

    public addSource<S extends Stats>(source: StatsSource<S>, prefix?: string) {
        this.sources.push({
            source,
            prefix: [this.config.basePrefix, prefix].filter(s => !!s).join('.') || undefined,
        });
    }

    public collectStats(): FlattenedStats {
        return this.sources.flatMap(source => flatStats(source.source.flushStats(), source.prefix));
    }

    private next = () => {
        this.collectTimer = null;
        const time = Date.now();
        const stats = this.collectStats();
        if (this.config.collect) {
            debug('Collecting stats from %d sources', this.sources.length);
            this.config.dest.pushMetrics({
                time,
                measurements: Object.fromEntries(stats.map(({ name, value }) => [name, value])),
            });
        }
        this.start();
    };

    public start() {
        if (this.active && this.collectTimer == null) {
            this.collectTimer = setTimeout(this.next, this.config.collectInterval);
        }
    }

    public shutdown(): Promise<void> {
        this.active = false;
        if (this.collectTimer != null) {
            clearTimeout(this.collectTimer);
        }
        return Promise.resolve();
    }
}

export function httpClientStats(agentStatus: AgentStatus): Stats {
    const {
        createSocketCount,
        createSocketErrorCount,
        closeSocketCount,
        errorSocketCount,
        requestCount,
        timeoutSocketCount,
    } = agentStatus;
    return {
        createSocketCount,
        createSocketErrorCount,
        closeSocketCount,
        errorSocketCount,
        requestCount,
        timeoutSocketCount,
    };
}

// Calculate nth percentile with linear interpolation between closest ranks
function percentile(n: number, measurements: number[]): number {
    const len = measurements.length;
    const pos = (len * n) / 100 - 1;
    const lower = measurements[Math.max(0, Math.floor(pos))];
    return lower + (measurements[Math.min(Math.max(0, Math.ceil(pos)), len - 1)] - lower) * (pos % 1);
}

const memo = <T>(fn: () => T) => {
    let memoized: T | null = null;
    return () => (memoized != null ? memoized : (memoized = fn()));
};

export class AggregateMetric {
    private measurements: number[] = [];

    public push(measurement: number) {
        this.measurements.push(measurement);
    }

    public flush(
        prefix: string,
        enabledAggregations: {
            min?: boolean;
            max?: boolean;
            count?: boolean;
            sum?: boolean;
            avg?: boolean;
            p80?: boolean;
            p90?: boolean;
            p95?: boolean;
            p99?: boolean;
        } = { min: true, max: true, avg: true, count: true, sum: true, p99: true }
    ): Stats {
        const measurements = this.measurements;
        this.measurements = [];
        const count = measurements.length;
        if (count === 0) {
            return enabledAggregations?.count ? { [`${prefix}.count`]: 0 } : {};
        }
        const last = measurements[count - 1];
        const sum = measurements.reduce((a, b) => a + b, 0);
        const sorted = memo(() => [...measurements].sort((a, b) => a - b));
        const stats = {
            count: enabledAggregations?.count ? count : undefined,
            sum: enabledAggregations?.sum ? sum : undefined,
            min: enabledAggregations?.min ? measurements.reduce((a, b) => Math.min(a, b), last) : undefined,
            max: enabledAggregations?.max ? measurements.reduce((a, b) => Math.max(a, b), last) : undefined,
            avg: enabledAggregations?.avg ? sum / count : undefined,
            p80: enabledAggregations?.p80 ? percentile(80, sorted()) : undefined,
            p90: enabledAggregations?.p90 ? percentile(90, sorted()) : undefined,
            p95: enabledAggregations?.p95 ? percentile(95, sorted()) : undefined,
            p99: enabledAggregations?.p99 ? percentile(99, sorted()) : undefined,
        };
        return Object.fromEntries(
            Object.entries(stats)
                .filter(([, value]) => value != null)
                .map(([name, value]) => [`${prefix}.${name}`, value])
        ) as Stats;
    }
}
