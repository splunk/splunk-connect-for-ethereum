import { createModuleDebug } from './utils/debug';
import { HecConfig } from './hec';

const { debug } = createModuleDebug('config');

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer U>
        ? ReadonlyArray<DeepPartial<U>>
        : DeepPartial<T[P]>;
};

export interface EthloggerConfig {
    workDir: string;
    hec: SplunkHecConfig;
    web3: {
        rpcUrl: string;
        wsUrl?: string;
        connectionTimeout: number;
    };
    etherscan?: {
        apiKey: string;
    };
    cache: CacheConfig;
}

export interface SplunkHecConfig extends HecConfig {
    eventIndex?: string;
    metricsIndex?: string;
    metricsPrefix?: string;
    internalMetricsIndex?: string;
    sourcetypes: {
        block: string;
        transaction: string;
        event: string;
        pendingtx: string;
        nodeInfo: string;
        nodeMetrics: string;
        quorumProtocol: string;
        gethPeer: string;
    };
}

export interface CacheConfig {
    maxEntries: number;
}

export const defaultSourcetypes: SplunkHecConfig['sourcetypes'] = {
    block: 'ethereum:block',
    transaction: 'ethereum:transaction',
    event: 'ethereum:transaction:event',
    pendingtx: 'ethereum:transaction:pending',
    nodeInfo: 'ethereum:node:info',
    nodeMetrics: 'ethereum:node:metrics',
    quorumProtocol: 'ethereum:quorum:protocol',
    gethPeer: 'ethereum:geth:peer',
};

export const CONFIG_DEFAULTS: DeepPartial<EthloggerConfig> = {
    web3: {
        connectionTimeout: 15000,
    },
    hec: {
        sourcetypes: defaultSourcetypes,
        metricsPrefix: 'eth',
    },
    cache: {
        maxEntries: 50_000,
    },
};

export function parseConfig() {
    debug('Parsing config');
    // todo
}
