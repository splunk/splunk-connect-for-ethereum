import { ManagedResource } from './resource';
import { HecClient } from '../hec';
import { AgentStatus } from 'agentkeepalive';
import { createModuleDebug } from './debug';

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
            uptime: process.uptime(),
        };
    }
}

export class InternalStatsCollector implements ManagedResource {
    private readonly sources: SourceHandle<Stats>[] = [];
    private active: boolean = true;
    private collectTimer: NodeJS.Timer | null = null;

    constructor(public config: { collectInterval: number; dest: HecClient; basePrefix?: string }) {
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
        debug('Collecting stats from %d sources', this.sources.length);
        this.config.dest.pushMetrics({
            time,
            measurements: Object.fromEntries(this.collectStats().map(({ name, value }) => [name, value])),
        });
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
