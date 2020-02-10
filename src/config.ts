import { IOptionFlag } from '@oclif/command/lib/flags';
import { readFile, pathExists } from 'fs-extra';
import { join } from 'path';
import { StartBlock } from './blockwatcher';
import { CLI_FLAGS } from './cliflags';
import { createModuleDebug } from './utils/debug';
import { durationStringToMs } from './utils/parse';
import { exponentialBackoff, linearBackoff, WaitTime } from './utils/retry';
import { safeLoad } from 'js-yaml';
import { removeEmtpyValues, deepMerge, isEmpty } from './utils/obj';

const { debug, warn, error } = createModuleDebug('config');

export class ConfigError extends Error {}

/** Root configuration schema for ethlogger */
export interface EthloggerConfigSchema {
    /** Ethereum node configuration */
    eth: EthereumConfigSchema;
    /**
     * In the output configuration you can specify where ethlogger will send generated
     * metrics and events to. By default it will send all information to Splunk HEC,
     * but you can instead send it to console output or a file.
     */
    output: OutputConfigSchema;
    /** HTTP event collector */
    hec: HecClientsConfigSchema;
    /** Checkpoint configuration - how ethlogger keeps track of state between restarts */
    checkpoint: CheckpointConfigSchema;
    /** ABI repository configuration */
    abi: AbiRepositoryConfigSchema;
    /** Contract info cache settings */
    contractInfo: ContractInfoConfigSchema;
    /** Block watcher settings, configure how blocks, transactions, event logs are ingested */
    blockWatcher: BlockWatcherConfigSchema;
    /** Settings for the node metrics collector */
    nodeMetrics: NodeMetricsConfigSchema;
    /** Settings for the node info collector */
    nodeInfo: NodeInfoConfigSchema;
    /** Settings for collecting pending transactions from node */
    pendingTx: PendingTxConfigSchema;
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
    pendingTx: PendingTxConfig;
    internalMetrics: InternalMetricsConfig;
}

export interface HecClientsConfigSchema {
    /**
     * Base settings that apply to all HEC clients. Overrides for events, metrics and
     * internal metrics will be layered on top of the defaults and allow for using
     * different HEC tokens, URL or destination index.
     */
    default: HecConfigSchema;
    /** HEC settings (overrides for `default`) for events sent to Splunk */
    events?: OptionalHecConfigSchema;
    /** HEC settings (overrides for `default`) for metrics sent to Splunk */
    metrics?: OptionalHecConfigSchema;
    /** HEC settings (overrides for `default`) for internal metrics sent to Splunk */
    internal?: OptionalHecConfigSchema;
}

/** General Ethereum configuration including client and transport, defining how ethlogger talks to the ethereum node */
export interface EthereumConfigSchema {
    /** URL of JSON RPC endpoint */
    url: string;
    /**
     * Network name logged as a field with every event and metric.
     * Ethlogger will attempt to automatically determine if not specified
     * but there are only a handful of known public networkIds associated
     * with particular networks (ethereum mainnet, ropsten, ...). Typical
     * values of the network name are `"mainnet"` or `"testnet"`.
     */
    network?: string;
    /**
     * Chain name logged as a field with every event and metric.
     * Ethlogger will attempt to automatically determine if not specified
     * but there are only a handful of known public chainIds associated
     * with particular ethereum-based chains. This value will allow
     * consumers of data to distinguish between different chains
     * in case multiple chains are being logged to one place.
     *
     * @see [https://chainid.network](https://chainid.network)
     */
    chain?: string;
    /** HTTP tansport configuration */
    http: HttpTransportConfigSchema;
    /** Ethereum client configuration */
    client: EthereumClientConfigSchema;
}

export interface EthereumConfig extends EthereumConfigSchema {
    http: HttpTransportConfig;
    client: EthereumClientConfig;
}

/**
 * The checkpoint is where ethlogger keeps track of its state, which blocks have already been processed.
 * This allows it to resume where it left off after being shut down and restarted.
 */
export interface CheckpointConfigSchema {
    /**
     * File path (relative to the current working directory) where the checkpoint file will be stored
     * @default checkpoints.json
     */
    filename: string;
    /** Maximum duration before saving updated checkpoint information to disk */
    saveInterval: DurationConfig;
}

export interface CheckpointConfig extends CheckpointConfigSchema {
    saveInterval: Duration;
}

/**
 * The ABI repository is used to decode ABI information from smart contract calls and event logs.
 * It generates and adds some additional information in transactions and events, including smart contract
 * method call parameter names, values and data types, as well as smart contract names associated with a
 * particular contract address.
 */
export interface AbiRepositoryConfigSchema {
    /** If specified, the ABI repository will recursively search this directory for ABI files */
    directory?: string;
    /** `true` to search ABI directory recursively for ABI files */
    searchRecursive?: boolean;
    /** Set to `.json` by default as the file extension for ABIs */
    abiFileExtension?: string;
    /**
     * If enabled, the ABI repsitory will creates hashes of all function and event signatures of an ABI
     * (the hash is the fingerprint) and match it against the EVM bytecode obtained from live smart contracts
     * we encounter.
     */
    fingerprintContracts: boolean;
    /**
     * If enabled, ethlogger will attempt to decode function calls and event logs using a set of
     * common signatures as a fallback if no match against any supplied ABI definition was found.
     */
    decodeAnonymous: boolean;
}

export type AbiRepositoryConfig = AbiRepositoryConfigSchema;

/**
 * Ethlogger checks for each address it encounters whether it is a smart contract by attempting to
 * retrieve the contract code. To reduce the performance hit by this operation, ethlogger can cache
 * contract information in memory.
 */
export interface ContractInfoConfigSchema {
    /** Maximum number of contract info results to cache in memory. Set to 0 to disable the cache. */
    maxCacheEntries: number;
}

export type ContractInfoConfig = ContractInfoConfigSchema;

/**
 * Block watcher is the component that retrieves blocks, transactions, event logs from the node and sends
 * them to output.
 */
export interface BlockWatcherConfigSchema {
    /** Specify `false` to disable the block watcher */
    enabled: boolean;
    /** Interval in which to look for the latest block number (if not busy processing the backlog) */
    pollInterval: DurationConfig;
    /** Max. number of blocks to fetch at once */
    blocksMaxChunkSize: number;
    /** Max. number of chunks to process in parallel */
    maxParallelChunks: number;
    /** If no checkpoint exists (yet), this specifies which block should be chosen as the starting point. */
    startAt: StartBlock;
    /** Wait time before retrying to fetch and process blocks after failure */
    retryWaitTime: WaitTimeConfig;
}

export interface BlockWatcherConfig extends Omit<BlockWatcherConfigSchema, 'retryWaitTime'> {
    pollInterval: Duration;
    retryWaitTime: WaitTime;
}

/** The node metrics colletor retrieves numeric measurements from nodes on a periodic basis. */
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

/** Platform specific node information is collection on regular interval */
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

/** Periodic collection of pending transactions */
export interface PendingTxConfigSchema {
    /** Enable or disable collection of pending transactions */
    enabled: boolean;
    /** Interval in which to collect pending transactions */
    collectInterval: DurationConfig;
    /** Wait time before retrying to collect pending transactions after failure */
    retryWaitTime: WaitTimeConfig;
}

export interface PendingTxConfig extends Omit<PendingTxConfigSchema, 'retryWaitTime'> {
    collectInterval: Duration;
    retryWaitTime: WaitTime;
}

/**
 * Ethlogger-internal metrics allow for visibility into the operation of ethlogger itself.
 */
export interface InternalMetricsConfigSchema {
    /** Specify `false` to disable internal metrics collection */
    enabled: boolean;
    /** Interval in which to collect internal metrics */
    collectInterval: DurationConfig;
}

export interface InternalMetricsConfig extends InternalMetricsConfigSchema {
    collectInterval: Duration;
}

/** Etherem client settings - configure batching multiple JSON RPC method calls into single HTTP requests */
export interface EthereumClientConfigSchema {
    /** Maximum number of JSON RPC requests to pack into a single batch. Set to `1` to disable batching. */
    maxBatchSize: number;
    /** Maximum time to wait before submitting a batch of JSON RPC requests */
    maxBatchTime: DurationConfig;
}

export interface EthereumClientConfig extends EthereumClientConfigSchema {
    maxBatchTime: Duration;
}

/** Settings for ethlogger connecting to the ethereum node via JSON RPC over HTTP */
export interface HttpTransportConfigSchema {
    /**
     * Time before failing JSON RPC requests. Specify a number in milliseconds or a golang-style duration expression.
     * @example "30s"
     */
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
    sourcetypes: SourcetypesSchema;
    /** A common prefix for all metrics emitted to Splunk */
    metricsPrefix?: string;
}

/** Configurable set of `sourcetype` field values emitted by ethlogger */
export interface SourcetypesSchema {
    /** @default "ethereum:block" */
    block?: string;
    /** @default "ethereum:transaction" */
    transaction?: string;
    /** @default "ethereum:transaction:event" */
    event?: string;
    /** @default "ethereum:transaction:pending" */
    pendingtx?: string;
    /** @default "ethereum:node:info" */
    nodeInfo?: string;
    /** @default "ethereum:node:metrics" */
    nodeMetrics?: string;
    /** @default "ethereum:geth:peer" */
    gethPeer?: string;
}

/** Console output prints all generated events and metrics to STDOUT */
export interface ConsoleOutputConfig {
    type: 'console';
}

/** File output will append all generated messages to a file. (this output type has not been implemented) */
export interface FileOutputConfig {
    type: 'file';
    /** Path to otuput file */
    path: string;
}

/** Null output will just drop all generated events and metrics */
export interface DevNullOutputConfig {
    type: 'null';
}

export type OutputConfigSchema = HecOutputConfig | ConsoleOutputConfig | FileOutputConfig | DevNullOutputConfig;

export type OutputConfig = OutputConfigSchema;

/** Settings for the Splunk HTTP Event Collector client */
export interface HecConfigSchema {
    /** The URL of HEC. If only the base URL is specified (path is omitted) then the default path will be used */
    url?: string;
    /** The HEC token used to authenticate HTTP requests */
    token?: string;
    /**
     * Defaults for host, source, sourcetype and index. Can be overriden for each message
     * @see [Use variables in metadata](#metadata-variables)
     */
    defaultMetadata?: {
        host?: string;
        source?: string;
        sourcetype?: string;
        index?: string;
    };
    /**
     * Default set of fields to apply to all events and metrics sent with this HEC client
     * @see [Use variables in metadata](#metadata-variables)
     */
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
    /** Set to `false` to disable HTTP keep-alive for connections to Splunk */
    requestKeepAlive?: boolean;
    /** If set to false, the HTTP client will ignore certificate errors (eg. when using self-signed certs) */
    validateCertificate?: boolean;
    /** Maximum number of sockets HEC will use (per host) */
    maxSockets?: number;
    /** User-agent header sent to HEC
     * @default `ethlogger-hec-client/<version>`
     * @see [Use variables in metadata](#metadata-variables)
     */
    userAgent?: string;
    /** Wait time before retrying to send a (batch of) HEC messages after an error */
    retryWaitTime?: WaitTimeConfig;
    /**
     * Enable sending multipe metrics in a single message to HEC.
     * Supported as of Splunk 8.0.0
     *
     * https://docs.splunk.com/Documentation/Splunk/8.0.0/Metrics/GetMetricsInOther#The_multiple-metric_JSON_format
     */
    multipleMetricFormatEnabled?: boolean;
    /**
     * If set to > 0, then ethlogger will wait for the HEC service to become available for the given amount of time
     * by periodically attempting to request the collector/health REST endpoint. This can be useful when starting
     * Splunk and ethlogger for example in docker-compose, where Splunk takes some time to start.
     */
    waitForAvailability?: DurationConfig;
}

export interface HecConfig extends Omit<HecConfigSchema, 'retryWaitTime'> {
    flushTime?: Duration;
    timeout?: Duration;
    retryWaitTime?: WaitTime;
    waitForAvailability?: Duration;
}

export type OptionalHecConfigSchema = Partial<HecConfigSchema>;

export type OptionalHecConfig = Partial<HecConfig>;

export type Duration = number;

/** Duration specified as golang style duration expression (eg "1h30m") or a number in milliseconds */
export type DurationConfig = number | string;

/** Exponentiallly increasing wait time with randomness */
export interface ExponentalBackoffConfig {
    type: 'exponential-backoff';
    /** Minimum wait time */
    min?: DurationConfig;
    /** Maximum wait time */
    max?: DurationConfig;
}
/** Linear increasing wait time */
export interface LinearBackoffConfig {
    type: 'linear-backoff';
    /** Minimum wait time (after the first failure) */
    min?: DurationConfig;
    /** Increase of wait time for each failure after the first until max is reached */
    step?: DurationConfig;
    /** Maximum wait time */
    max?: DurationConfig;
}
/**
 * Time to wait between retries. Can either be a fixed duration or a dynamic backoff function
 * where the wait time is determined based on the number of attempts made so far.
 */
export type WaitTimeConfig = DurationConfig | ExponentalBackoffConfig | LinearBackoffConfig;

export function parseDuration(value?: DurationConfig): Duration | undefined {
    if (typeof value === 'string') {
        return durationStringToMs(value);
    }
    return value;
}

export function waitTimeFromConfig(config?: WaitTimeConfig | DeepPartial<WaitTimeConfig>): WaitTime | undefined {
    if (config == null) {
        return undefined;
    }
    if (typeof config === 'number') {
        return config;
    } else if (typeof config === 'string') {
        return parseDuration(config);
    } else if (typeof config === 'object' && 'type' in config) {
        if (config.type === 'exponential-backoff') {
            const args = { min: parseDuration(config.min) ?? 0, max: parseDuration(config.max) };
            debug('Creating exponential-backoff wait time function with args %o', args);
            return exponentialBackoff(args);
        } else if (config.type === 'linear-backoff') {
            if (config.max == null || (config.step ?? 0) > config.max) {
                throw new ConfigError('Invalid linear-backoff wait time specified: max and step values are required');
            }
            const args = {
                min: parseDuration(config.min) ?? 0,
                step: parseDuration(config.step) ?? 1000,
                max: parseDuration(config.max) ?? 10000,
            };
            debug('Creating linear-backoff wait time function with args %o', args);
            return linearBackoff(args);
        } else {
            throw new ConfigError(`Invalid wait time type: ${(config as any).type}`);
        }
    }
    throw new ConfigError(`Invalid wait time config: ${JSON.stringify(config)}`);
}

function parseStartAt(input: string | number | null | undefined): StartBlock | undefined {
    if (input == null) {
        return undefined;
    }
    if (typeof input === 'number') {
        return input;
    }
    if (input === 'genesis' || input === 'latest') {
        return input;
    }
    if (typeof input === 'string') {
        const n = parseInt(input, 10);
        if (!isNaN(n)) {
            return n;
        }
    }
    throw new ConfigError(`Invalid start-at-block config: ${JSON.stringify(input)}`);
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

export type CliFlags<T = typeof CLI_FLAGS> = {
    [P in keyof T]: T[P] extends IOptionFlag<infer R> ? R : any;
};

export const DEFAULT_CONFIG_FILE_NAME = 'ethlogger.yaml';

export function checkConfig(config: EthloggerConfig): string[] {
    const problems = [];

    // Check if HEC URL is either specified in defaults or for each enabled metrics/events hec client
    if (config.output.type === 'hec') {
        if (config.hec.default.url == null) {
            if (config.hec.events?.url == null) {
                problems.push('No URL for HEC events specified. Use --hec-url or configure via ethlogger.yaml');
            }

            if (config.nodeMetrics.enabled && config.hec.metrics?.url == null) {
                problems.push('No URL for HEC metrics specified. Use --hec-url or configure via ethlogger.yaml');
            }

            if (config.internalMetrics.enabled && config.hec.internal?.url == null) {
                problems.push(
                    'No URL for HEC internal metrics specified. Use --hec-url or configure via ethlogger.yaml'
                );
            }
        }

        if (config.nodeMetrics.enabled) {
            if (config.hec.metrics?.defaultMetadata?.index == null && config.hec.metrics?.token == null) {
                problems.push(
                    'No index nor hec token specified for metrics. Metrics may not be routed to the correct Splunk index. ' +
                        'Use flags --hec-metrics-index or --hec-metrics-token or configure via ethlogger.yaml'
                );
            }
        }

        if (config.internalMetrics.enabled) {
            if (config.hec.internal?.defaultMetadata?.index == null && config.hec.internal?.token == null) {
                problems.push(
                    'No index nor hec token specified for internal metrics. Metrics may not be routed to the correct Splunk index. ' +
                        'Use flags --hec-internal-index or --hec-internal-token or configure via ethlogger.yaml'
                );
            }
        }
    }

    return problems;
}

const parseBooleanEnvVar = (envVar?: string): boolean | undefined => {
    if (envVar != null) {
        const val = process.env[envVar];
        if (val != null) {
            switch (val.trim().toLowerCase()) {
                case '1':
                case 'true':
                case 'yes':
                case 'on':
                    return true;
                case '0':
                case 'false':
                case 'no':
                case 'off':
                    return false;
                default:
                    throw new ConfigError(
                        `Unexpected vablue for environment variable ${envVar} - boolean value (true or false) expected`
                    );
            }
        }
    }
};

export async function loadEthloggerConfig(flags: CliFlags, dryRun: boolean = false): Promise<EthloggerConfig> {
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

    const parseSpecificHecConfig = (
        defaults: DeepPartial<HecConfigSchema> | undefined,
        indexFlag: keyof CliFlags,
        tokenFlag: keyof CliFlags
    ): HecConfig | undefined => {
        const result = removeEmtpyValues({
            defaultFields: defaults?.defaultFields,
            defaultMetadata: flags[indexFlag]
                ? Object.assign({}, defaults?.defaultMetadata, { index: flags[indexFlag] })
                : defaults?.defaultMetadata,
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
            token: flags[tokenFlag] ?? defaults?.token,
            url: defaults?.url,
            userAgent: defaults?.userAgent,
            validateCertificate: defaults?.validateCertificate,
            waitForAvailability: parseDuration(defaults?.waitForAvailability),
        });
        return isEmpty(result) ? undefined : result;
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
            chain: flags['chain-name'],
            client: {
                maxBatchSize: defaults.eth?.client?.maxBatchSize ?? 0,
                maxBatchTime: parseDuration(defaults.eth?.client?.maxBatchTime!) ?? 0,
            },
            http: {
                maxSockets: defaults.eth?.http?.maxSockets!,
                requestKeepAlive: defaults.eth?.http?.requestKeepAlive!,
                timeout: parseDuration(defaults.eth?.http?.timeout!),
                validateCertificate:
                    flags['eth-reject-invalid-certs'] ??
                    parseBooleanEnvVar(CLI_FLAGS['eth-reject-invalid-certs'].env) ??
                    flags['reject-invalid-certs'] ??
                    parseBooleanEnvVar(CLI_FLAGS['reject-invalid-certs'].env) ??
                    defaults.eth?.http?.validateCertificate,
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
                waitForAvailability: parseDuration(defaults.hec?.default?.waitForAvailability),
                validateCertificate:
                    flags['hec-reject-invalid-certs'] ??
                    parseBooleanEnvVar(CLI_FLAGS['hec-reject-invalid-certs'].env) ??
                    flags['reject-invalid-certs'] ??
                    parseBooleanEnvVar(CLI_FLAGS['reject-invalid-certs'].env) ??
                    defaults.hec?.default?.validateCertificate,
            },
            events: parseSpecificHecConfig(defaults.hec?.events, 'hec-events-index', 'hec-events-token'),
            metrics: parseSpecificHecConfig(defaults.hec?.metrics, 'hec-metrics-index', 'hec-metrics-token'),
            internal: parseSpecificHecConfig(defaults.hec?.internal, 'hec-internal-index', 'hec-internal-token'),
        },
        output: parseOutput(defaults.output),
        abi: {
            directory: flags['abi-dir'] ?? defaults.abi?.directory,
            abiFileExtension: defaults.abi?.abiFileExtension,
            fingerprintContracts: defaults.abi?.fingerprintContracts ?? true,
            decodeAnonymous: defaults.abi?.decodeAnonymous ?? true,
        },
        blockWatcher: {
            enabled:
                flags['collect-blocks'] ??
                parseBooleanEnvVar(CLI_FLAGS['collect-blocks'].env) ??
                defaults.blockWatcher?.enabled ??
                true,
            blocksMaxChunkSize: defaults.blockWatcher?.blocksMaxChunkSize ?? 25,
            maxParallelChunks: defaults.blockWatcher?.maxParallelChunks ?? 3,
            pollInterval: parseDuration(defaults.blockWatcher?.pollInterval) ?? 500,
            startAt: parseStartAt(flags['start-at-block'] ?? defaults.blockWatcher?.startAt) ?? 'genesis',
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
            enabled:
                flags['collect-internal-metrics'] ??
                parseBooleanEnvVar(CLI_FLAGS['collect-internal-metrics'].env) ??
                defaults.internalMetrics?.enabled ??
                (() => {
                    if (
                        flags['hec-internal-index'] != null ||
                        defaults.hec?.internal?.defaultMetadata?.index != null ||
                        flags['hec-internal-token'] != null ||
                        defaults.hec?.internal?.token != null
                    ) {
                        return true;
                    }
                    warn(
                        'Implicitly disabling ethlogger-internal metrics collection. No dedicated index or HEC token specified.'
                    );
                    return false;
                })(),
            collectInterval: parseDuration(defaults.internalMetrics?.collectInterval) ?? 1000,
        },
        nodeInfo: {
            enabled:
                flags['collect-node-info'] ??
                parseBooleanEnvVar(CLI_FLAGS['collect-node-info'].env) ??
                defaults.nodeInfo?.enabled ??
                true,
            collectInterval: parseDuration(defaults.nodeInfo?.collectInterval) ?? 60000,
            retryWaitTime: waitTimeFromConfig(defaults.nodeInfo?.retryWaitTime) ?? 60000,
        },
        nodeMetrics: {
            enabled:
                flags['collect-node-metrics'] ??
                parseBooleanEnvVar(CLI_FLAGS['collect-node-metrics'].env) ??
                defaults.nodeMetrics?.enabled ??
                true,
            collectInterval: parseDuration(defaults.nodeMetrics?.collectInterval) ?? 10000,
            retryWaitTime: waitTimeFromConfig(defaults.nodeMetrics?.retryWaitTime) ?? 10000,
        },
        pendingTx: {
            enabled:
                flags['collect-pending-transactions'] ??
                parseBooleanEnvVar(CLI_FLAGS['collect-pending-transactions'].env) ??
                defaults.pendingTx?.enabled ??
                false,
            collectInterval: parseDuration(defaults.pendingTx?.collectInterval) ?? 30000,
            retryWaitTime: waitTimeFromConfig(defaults.pendingTx?.retryWaitTime) ?? 30000,
        },
    };

    const result = config as EthloggerConfig;

    const problems = checkConfig(result);

    if (problems.length > 0) {
        for (const msg of problems) {
            error('Detected problem in ethlogger config: %s', msg);
        }
        if (!dryRun) {
            throw new ConfigError(
                problems.length > 1 ? 'Detected multipe problems in ethlogger configuration, see logs' : problems[0]
            );
        }
    }

    return result;
}
