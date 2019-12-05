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
    source?: string;
    sourcetypes: {
        block: string;
        transaction: string;
        event: string;
        pendingtx: string;
    };
}

export interface CacheConfig {
    maxEntries: number;
}

export const defaultSourcetypes: SplunkHecConfig['sourcetypes'] = {
    block: 'block',
    transaction: 'transaction',
    event: 'transaction:event',
    pendingtx: 'transaction:pending',
};

export const CONFIG_DEFAULTS: DeepPartial<EthloggerConfig> = {
    web3: {
        connectionTimeout: 15000,
    },
    hec: {
        sourcetypes: defaultSourcetypes,
    },
    cache: {
        maxEntries: 50_000,
    },
};

export function parseConfig() {
    debug('Parsing config');
    // todo
}
