import { IOptionFlag } from '@oclif/command/lib/flags';
import { readFile, pathExists } from 'fs-extra';
import { join } from 'path';
import { StartBlock } from './blockwatcher';
import { CLI_FLAGS } from './cliflags';
import { createModuleDebug } from './utils/debug';
import { durationStringToMs } from './utils/parse';
import { exponentialBackoff, linearBackoff, WaitTime } from './utils/retry';
import { safeLoad } from 'js-yaml';
import { removeEmtpyValues, deepMerge } from './utils/obj';

const { debug, error } = createModuleDebug('config');

export class ConfigError extends Error {}

// Configuration file schema
export interface EthloggerConfigSchema {
    /** Ethereum node configuration */
    eth: EthereumConfigSchema;
    /** Output configuration */
    output: OutputConfigSchema;
    /** HTTP event collector */
    hec: {
        /** Base settings that apply to  */
        default: HecConfigSchema;
        /** HEC settings for events sent to Splunk */
        events?: OptionalHecConfigSchema;
        /** HEC settings for metrics sent to Splunk */
        metrics?: OptionalHecConfigSchema;
        /** HEC settings for internal metrics sent to Splunk */
        internal?: OptionalHecConfigSchema;
    };
    /** Checkpoint configuration - how ethlogger keeps track of state between restarts */
    checkpoint: CheckpointConfigSchema;
    /** ABI repository configuration */
    abi: AbiRepositoryConfigSchema;
    /** Contract info cache settings */
    contractInfo: ContractInfoConfigSchema;
    /** Block watcher - the component monitoring the blocks */
    blockWatcher: BlockWatcherConfigSchema;
    /** Settings for the node metrics collector */
    nodeMetrics: NodeMetricsConfigSchema;
    /** Settings for the node info collector */
    nodeInfo: NodeInfoConfigSchema;
    /** Settings for internal metrics collection */
    internalMetrics: InternalMetricsConfigSchema;
}

// Resolved configuraiton
export interface EthloggerConfig {
    eth: EthereumConfig;
    output: OutputConfigSchema;
    hec: {
        default: HecConfig;
        events?: OptionalHecConfig;
        metrics?: OptionalHecConfig;
        internal?: OptionalHecConfig;
    };
    checkpoint: CheckpointConfig;
    abi: AbiRepositoryConfig;
    contractInfo: ContractInfoConfig;
    blockWatcher: BlockWatcherConfig;
    nodeMetrics: NodeMetricsConfig;
    nodeInfo: NodeInfoConfig;
    internalMetrics: InternalMetricsConfig;
}

export interface EthereumConfigSchema {
    /** URL of JSON RPC endpoint */
    url: string;
    /**
     * Network name send as a field with every event and metric to HEC.
     * Ethlogger will attempt to automatically determine if not specified
     * but there are only a handful of known public networkIds associated
     * with particular networks (ethereum mainnet, ropsten, ...). This value
     * will allow consumers of data to distinguis between different networks
     * in case multiple ethloggers are sending events from different networks.
     */
    network?: string;
    /** HTTP tansport configuration */
    http: HttpTransportConfigSchema;
    /** Ethereum client configuration */
    client: EthereumClientConfigSchema;
}

export interface EthereumConfig extends EthereumConfigSchema {
    http: HttpTransportConfig;
    client: EthereumClientConfig;
}

export interface CheckpointConfigSchema {
    /** File path (relative to the current working directory) where the checkpoint file will be stored */
    filename: string;
    /** Maximum duration before saving updated checkpoint information to disk */
    saveInterval: DurationConfig;
}

export interface CheckpointConfig extends CheckpointConfigSchema {
    saveInterval: Duration;
}

export interface AbiRepositoryConfigSchema {
    /** If specified, the ABI repository will recursively search this directory for ABI files */
    directory?: string;
    /**  */
    fileExtension?: string;
    /**
     * If enabled, the ABI repsitory will creates hashes of all function and event signatures of an ABI
     * (the hash is the fingerprint) and match it against the EVM bytecode obtained from live smart contracts
     * we encounter.
     *
     * NOTE: disabling it is currently being ignored since non-fingerprint matching hasn't been implemented
     */
    fingerprintContracts: boolean; // TODO
}

export type AbiRepositoryConfig = AbiRepositoryConfigSchema;

export interface ContractInfoConfigSchema {
    /** Maximum number of contract info results to cache in memory. Set to 0 to disable the cache. */
    maxCacheEntries: number;
}

export type ContractInfoConfig = ContractInfoConfigSchema;

export interface BlockWatcherConfigSchema {
    /** Specify `false` to disable the block watcher */
    enabled: boolean;
    /** Interval in which to look for the latest block number (if not busy processing the backlog) */
    pollInterval: DurationConfig;
    /** Max. number of blocks to fetch at once */
    blocksMaxChunkSize: number;
    /**
     * If no checkpoint exists (yet), this specifies which block should be chosen as the starting point.
     * Specify a positive integer for an absolute block number or a negative integer to start at n blocks
     * before the latest one. You can also specify "genesis" (block 0) or "latest" (currently latest block).
     */
    startAt: StartBlock;
    /** Wait time before retrying to fetch and process blocks after failure */
    retryWaitTime: WaitTimeConfig;
}

export interface BlockWatcherConfig extends Omit<BlockWatcherConfigSchema, 'retryWaitTime'> {
    pollInterval: Duration;
    retryWaitTime: WaitTime;
}

export interface NodeMetricsConfigSchema {
    /** Specify `false` to disable node metrics collection */
    enabled: boolean;
    /** Interval in which to collect node metrics */
    collectInterval: DurationConfig;
    /** Wait time before retrying to collect node metrics after failure */
    retryWaitTime: WaitTimeConfig;
}

export interface NodeMetricsConfig extends Omit<NodeMetricsConfigSchema, 'retryWaitTime'> {
    collectInterval: Duration;
    retryWaitTime: WaitTime;
}

export interface NodeInfoConfigSchema {
    /** Specify `false` to disable node info collection */
    enabled: boolean;
    /** Interval in which to collect node info */
    collectInterval: DurationConfig;
    /** Wait time before retrying to collect node info after failure */
    retryWaitTime: WaitTimeConfig;
}

export interface NodeInfoConfig extends Omit<NodeInfoConfigSchema, 'retryWaitTime'> {
    collectInterval: Duration;
    retryWaitTime: WaitTime;
}

export interface InternalMetricsConfigSchema {
    /** Specify `false` to disable internal metrics collection */
    enabled: boolean;
    /** Interval in which to collect internal metrics */
    collectInterval: DurationConfig;
}

export interface InternalMetricsConfig extends InternalMetricsConfigSchema {
    collectInterval: Duration;
}

export interface EthereumClientConfigSchema {
    /** Maximum number of JSON RPC requests to pack into a single batch */
    maxBatchSize: number;
    /** Maximum time to wait before submitting a batch of JSON RPC requests */
    maxBatchTime: DurationConfig;
}

export interface EthereumClientConfig extends EthereumClientConfigSchema {
    maxBatchTime: Duration;
}

export interface HttpTransportConfigSchema {
    /** Time before failing JSON RPC requests */
    timeout?: DurationConfig;
    /** If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs) */
    validateCertificate?: boolean;
    /** Keep sockets to JSON RPC open */
    requestKeepAlive?: boolean;
    /** Maximum number of sockets HEC will use (per host) */
    maxSockets?: number;
}

export interface HttpTransportConfig extends HttpTransportConfigSchema {
    timeout?: Duration;
}

export interface HecOutputConfig {
    type: 'hec';
    /** Sourcetypes to use for different kinds of events we send to Splunk */
    sourcetypes: {
        block?: string;
        transaction?: string;
        event?: string;
        pendingtx?: string;
        nodeInfo?: string;
        nodeMetrics?: string;
        quorumProtocol?: string;
        gethPeer?: string;
    };
    /** A common prefix for all metrics emitted to Splunk */
    metricsPrefix?: string;
}

export interface ConsoleOutputConfig {
    type: 'console';
}

export interface FileOutputConfig {
    type: 'file';
    path: string;
}

export interface DevNullOutputConfig {
    type: 'null';
}

export type OutputConfigSchema = HecOutputConfig | ConsoleOutputConfig | FileOutputConfig | DevNullOutputConfig;

export type OutputConfig = OutputConfigSchema;

export interface HecConfigSchema {
    /** The URL of HEC. If only the base URL is specified (path is omitted) then the default path will be used */
    url?: string;
    /** The HEC token used to authenticate HTTP requests */
    token?: string;
    /** Defaults for host, source, sourcetype and index. Can be overriden for each message */
    defaultMetadata?: {
        host?: string;
        source?: string;
        sourcetype?: string;
        index?: string;
    };
    /** Default set of fields to apply to all events and metrics sent with this HEC client */
    defaultFields?: { [k: string]: any };
    /** Maximum number of entries in the HEC message queue before flushing it */
    maxQueueEntries?: number;
    /** Maximum number of bytes in the HEC message queue before flushing it */
    maxQueueSize?: number;
    /** Maximum number of milliseconds to wait before flushing the HEC message queue */
    flushTime?: DurationConfig;
    /** Gzip compress the request body sent to HEC (Content-Encoding: gzip) */
    gzip?: boolean;
    /** Maximum number of attempts to send a batch to HEC. By default this there is no limit */
    maxRetries?: number;
    /** Number of milliseconds to wait before considereing an HTTP request as failed */
    timeout?: DurationConfig;
    /** Keep sockets to HEC open */
    requestKeepAlive?: boolean;
    /** If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs) */
    validateCertificate?: boolean;
    /** Maximum number of sockets HEC will use (per host) */
    maxSockets?: number;
    /** User-agent header sent to HEC */
    userAgent?: string;
    /** Wait time before retrying to send a (batch of) HEC messages */
    retryWaitTime?: WaitTimeConfig;
    /**
     * Enable sending multipe metrics in a single message to HEC.
     * Supported as of Splunk 8.0.0
     * https://docs.splunk.com/Documentation/Splunk/8.0.0/Metrics/GetMetricsInOther#The_multiple-metric_JSON_format
     */
    multipleMetricFormatEnabled?: boolean;
}

export interface HecConfig extends Omit<HecConfigSchema, 'retryWaitTime'> {
    flushTime?: Duration;
    timeout?: Duration;
    retryWaitTime?: WaitTime;
}

export type OptionalHecConfigSchema = Partial<HecConfigSchema>;

export type OptionalHecConfig = Partial<HecConfig>;

export type Duration = number;

/** Duration specified as golang style duration expression (eg "1h30m") or a number in milliseconds */
export type DurationConfig = number | string;

export type ExponentalBackoffConfig = { type: 'exponential-backoff'; min?: number; max?: number };
export type LinearBackoffConfig = { type: 'linear-backoff'; min?: number; step?: number; max?: number };
export type WaitTimeConfig = DurationConfig | ExponentalBackoffConfig | LinearBackoffConfig;

export function waitTimeFromConfig(config?: WaitTimeConfig | DeepPartial<WaitTimeConfig>): WaitTime | undefined {
    if (config == null) {
        return undefined;
    }
    if (typeof config === 'number') {
        return config;
    } else if (typeof config === 'object' && 'type' in config) {
        if (config.type === 'exponential-backoff') {
            return exponentialBackoff({ min: config.min ?? 0, max: config.max });
        } else if (config.type === 'linear-backoff') {
            if (config.max == null || (config.step ?? 0) > config.max) {
                throw new ConfigError('Invalid linear-backoff wait time specified: max and step values are required');
            }
            return linearBackoff({ min: config.min ?? 0, step: config.step ?? 1000, max: config.max ?? 10000 });
        } else {
            throw new ConfigError(`Invalid wait time type: ${(config as any).type}`);
        }
    }
    throw new ConfigError(`Invalid wait time config: ${JSON.stringify(config)}`);
}

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer U>
        ? ReadonlyArray<DeepPartial<U>>
        : DeepPartial<T[P]>;
};

export async function loadConfigFile(
    fileName: string,
    type?: 'json' | 'yaml'
): Promise<DeepPartial<EthloggerConfigSchema>> {
    let detectedType = type;
    if (type == null) {
        if (fileName.endsWith('.json')) {
            detectedType = 'json';
        } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
            detectedType = 'yaml';
        } else {
            throw new ConfigError(`Unsupported file format for config path %s (use .yaml or .json file extension)`);
        }
    }
    const fileContents = await readFile(fileName, { encoding: 'utf-8' });
    if (detectedType === 'json') {
        return JSON.parse(fileContents);
    } else if (detectedType === 'yaml') {
        return safeLoad(fileContents, { filename: fileName });
    }

    return {};
}

export function parseDuration(value?: DurationConfig): Duration | undefined {
    if (typeof value === 'string') {
        return durationStringToMs(value);
    }
    return value;
}

type CliFlags<T = typeof CLI_FLAGS> = {
    [P in keyof T]: T[P] extends IOptionFlag<infer R> ? R : any;
};

export const DEFAULT_CONFIG_FILE_NAME = 'ethlogger.yaml';

export async function loadEthloggerConfig(
    fileName: string | undefined,
    flags: CliFlags,
    dryRun: boolean = false
): Promise<EthloggerConfig> {
    const defaultsPath = join(__dirname, '../defaults.ethlogger.yaml');
    debug('Loading config defaults from %s', defaultsPath);
    let defaults = await loadConfigFile(defaultsPath, 'yaml');
    debug('Loaded config defaults: %O', defaults);

    if (flags['config-file']) {
        const configFromFile = await loadConfigFile(flags['config-file']);
        debug('Loaded config from file %s specified via --config-file flag: %O', flags['config-file'], configFromFile);
        defaults = deepMerge(defaults, configFromFile);
    } else if (await pathExists(DEFAULT_CONFIG_FILE_NAME)) {
        debug('Found default config file %s', DEFAULT_CONFIG_FILE_NAME);
        const configFromFile = await loadConfigFile(DEFAULT_CONFIG_FILE_NAME, 'yaml');
        debug('Loaded config from file %s: %O', DEFAULT_CONFIG_FILE_NAME, configFromFile);
        defaults = deepMerge(defaults, configFromFile);
    } else {
        debug('No config file specified, going with defaults and flag overrides');
    }

    const required = <T>(flag: keyof CliFlags, configValue: T | undefined): T => {
        const val: T = flags[flag];
        if (val == null) {
            if (configValue == null) {
                if (dryRun) {
                    error('Missing required option --%s', flag);
                } else {
                    throw new ConfigError(`Missing required option --${flag}`);
                }
            } else {
                return configValue;
            }
        }
        return val;
    };

    const parseSpecificHecConfig = (defaults?: DeepPartial<HecConfigSchema>): HecConfig => {
        const result = removeEmtpyValues({
            defaultFields: defaults?.defaultFields,
            defaultMetadata: defaults?.defaultMetadata,
            flushTime: parseDuration(defaults?.flushTime),
            gzip: defaults?.gzip,
            maxQueueEntries: defaults?.maxQueueEntries,
            maxQueueSize: defaults?.maxQueueSize,
            maxRetries: defaults?.maxRetries,
            maxSockets: defaults?.maxSockets,
            multipleMetricFormatEnabled: defaults?.multipleMetricFormatEnabled,
            requestKeepAlive: defaults?.requestKeepAlive,
            retryWaitTime: waitTimeFromConfig(defaults?.retryWaitTime as WaitTimeConfig),
            timeout: parseDuration(defaults?.timeout),
            token: defaults?.token,
            url: defaults?.url,
            userAgent: defaults?.userAgent,
            validateCertificate: defaults?.validateCertificate,
        });
        return result;
    };

    const parseOutput = (defaults?: Partial<OutputConfigSchema>): OutputConfigSchema => {
        switch (defaults?.type) {
            case 'hec':
                const def = defaults as Partial<HecOutputConfig>;
                return {
                    type: 'hec',
                    sourcetypes: def.sourcetypes ?? {},
                    metricsPrefix: def.metricsPrefix,
                };
            case 'console':
                return {
                    type: 'console',
                };
            case 'file':
                return {
                    type: 'file',
                    path: (defaults as Partial<FileOutputConfig>)?.path!,
                };
            case 'null':
                return {
                    type: 'null',
                };
            default:
                return {
                    type: 'hec',
                    sourcetypes: {},
                    metricsPrefix: 'eth',
                };
        }
    };

    const config: EthloggerConfig = {
        eth: {
            url: required('eth-rpc-url', defaults.eth?.url),
            network: flags['network-name'] ?? defaults.eth?.network,
            client: {
                maxBatchSize: defaults.eth?.client?.maxBatchSize ?? 0,
                maxBatchTime: parseDuration(defaults.eth?.client?.maxBatchTime!) ?? 0,
            },
            http: {
                maxSockets: defaults.eth?.http?.maxSockets!,
                requestKeepAlive: defaults.eth?.http?.requestKeepAlive!,
                timeout: parseDuration(defaults.eth?.http?.timeout!),
                validateCertificate: flags['eth-reject-invalid-certs'] ?? defaults.eth?.http?.validateCertificate,
            },
        },
        hec: {
            default: {
                url: required('hec-url', defaults.hec?.default?.url),
                token: required('hec-token', defaults.hec?.default?.token),
                defaultFields: defaults.hec?.default?.defaultFields,
                defaultMetadata: defaults.hec?.default?.defaultMetadata,
                flushTime: parseDuration(defaults.hec?.default?.flushTime),
                gzip: defaults.hec?.default?.gzip,
                maxQueueEntries: defaults.hec?.default?.maxQueueEntries,
                maxQueueSize: defaults.hec?.default?.maxQueueSize,
                maxRetries: defaults.hec?.default?.maxRetries ?? Infinity,
                maxSockets: defaults.hec?.default?.maxSockets,
                multipleMetricFormatEnabled: defaults.hec?.default?.multipleMetricFormatEnabled,
                requestKeepAlive: defaults.hec?.default?.requestKeepAlive,
                retryWaitTime: waitTimeFromConfig(defaults.hec?.default?.retryWaitTime as WaitTimeConfig),
                timeout: parseDuration(defaults.hec?.default?.timeout),
                userAgent: defaults.hec?.default?.userAgent,
                validateCertificate:
                    flags['hec-reject-invalid-certs'] ??
                    flags['reject-invalid-certs'] ??
                    defaults.hec?.default?.validateCertificate,
            },
            events: defaults.hec?.events === null ? undefined : parseSpecificHecConfig(defaults.hec?.events),
            metrics: defaults.hec?.metrics === null ? undefined : parseSpecificHecConfig(defaults.hec?.metrics),
            internal: defaults.hec?.internal === null ? undefined : parseSpecificHecConfig(defaults.hec?.internal),
        },
        output: parseOutput(defaults.output),
        abi: {
            directory: flags['abi-dir'] ?? defaults.abi?.directory,
            fingerprintContracts: defaults.abi?.fingerprintContracts ?? true,
        },
        blockWatcher: {
            enabled: flags['collect-blocks'] ?? defaults.blockWatcher?.enabled ?? true,
            blocksMaxChunkSize: defaults.blockWatcher?.blocksMaxChunkSize ?? 25,
            pollInterval: parseDuration(defaults.blockWatcher?.pollInterval) ?? 500,
            startAt: defaults.blockWatcher?.startAt ?? 'genesis',
            retryWaitTime: waitTimeFromConfig(defaults.blockWatcher?.retryWaitTime) ?? 60000,
        },
        checkpoint: {
            filename: defaults.checkpoint?.filename ?? 'checkpoint.json',
            saveInterval: parseDuration(defaults.checkpoint?.saveInterval) ?? 100,
        },
        contractInfo: {
            maxCacheEntries: defaults.contractInfo?.maxCacheEntries ?? 25000,
        },
        internalMetrics: {
            enabled: flags['collect-internal-metrics'] ?? defaults.internalMetrics?.enabled ?? true,
            collectInterval: parseDuration(defaults.internalMetrics?.collectInterval) ?? 1000,
        },
        nodeInfo: {
            enabled: flags['collect-node-info'] ?? defaults.nodeInfo?.enabled ?? true,
            collectInterval: parseDuration(defaults.nodeInfo?.collectInterval) ?? 60000,
            retryWaitTime: waitTimeFromConfig(defaults.nodeInfo?.retryWaitTime) ?? 60000,
        },
        nodeMetrics: {
            enabled: flags['collect-node-metrics'] ?? defaults.nodeMetrics?.enabled ?? true,
            collectInterval: parseDuration(defaults.nodeMetrics?.collectInterval) ?? 60000,
            retryWaitTime: waitTimeFromConfig(defaults.nodeMetrics?.retryWaitTime) ?? 60000,
        },
    };

    return config as EthloggerConfig;
}
