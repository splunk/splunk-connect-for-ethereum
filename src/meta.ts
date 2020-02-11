import { hostname } from 'os';
import { EthloggerConfig } from './config';
import { NodePlatformAdapter } from './platforms';
import { createModuleDebug } from './utils/debug';
import { removeEmtpyValues } from './utils/obj';
import { subsituteVariables, subsituteVariablesInValues } from './utils/vars';

const { debug } = createModuleDebug('meta');

export interface MetadataVariables {
    /** Hostname of the machine ethlogger is running on */
    HOSTNAME: string;
    /** Enode retrieved from the node via platform-specific APIs */
    ENODE?: string;
    /**
     * The name of the ethereum node platform (geth, quorum, parity) or
     * "generic" if the platform couldn't be determined.
     */
    PLATFORM: string;
    /** The numberic ID of the ethereum network */
    NETWORK_ID?: string;
    /**
     * The network name supplied via ethlogger config or auto-detected
     * for known networks from the network ID. Typical values are
     * `"mainnet"` or `"testnet"`
     */
    NETWORK?: string;
    /**
     * Chain ID is the currently configured CHAIN_ID value used for
     * signing replay-protected transactions, introduced via EIP-155
     */
    CHAIN_ID?: string;
    /**
     * The chain name supplied via ethlogger config or auto-detected
     * for known networks from the chain ID and network ID
     */
    CHAIN?: string;
    /** The ethlogger PID */
    PID: string;
    /** Ethlogger version */
    VERSION: string;
    /** The node.js version ethlogger is running on */
    NODE_VERSION: string;
    /**
     * Hostname (or IP) of the ethereum node from the transport used.
     * For HTTP transport the host portion of the URL (without port)
     * is used.
     */
    ETH_NODE_HOSTNAME: string;
}

export function substituteVariablesInHecConfig(
    config: EthloggerConfig,
    {
        platformAdapter,
        transportOriginHost,
        ethloggerVersion,
        nodeVersion = process.version,
        pid = process.pid,
        host = hostname(),
    }: {
        platformAdapter: NodePlatformAdapter;
        ethloggerVersion: string;
        nodeVersion?: string;
        pid?: number;
        host?: string;
        transportOriginHost: string;
    }
) {
    const networkId = platformAdapter.networkId;
    const chainId = platformAdapter.chainId;
    const metaVariables: MetadataVariables = {
        HOSTNAME: host,
        ENODE: platformAdapter.enode ?? '',
        PLATFORM: platformAdapter.name,
        NETWORK_ID: networkId != null ? String(networkId) : '',
        NETWORK: platformAdapter.networkName ?? '',
        PID: String(pid),
        VERSION: ethloggerVersion,
        NODE_VERSION: nodeVersion,
        ETH_NODE_HOSTNAME: transportOriginHost,
        CHAIN_ID: chainId != null ? String(chainId) : '',
        CHAIN: platformAdapter.chainName ?? '',
    };

    const resolvedVariables = removeEmtpyValues(metaVariables);

    Object.entries(config.hec).forEach(([name, cfg]) => {
        debug('Replacing metadata variables in HEC config %s', name);
        if (cfg?.defaultFields != null) {
            cfg.defaultFields = subsituteVariablesInValues(cfg.defaultFields, resolvedVariables);
        }
        if (cfg?.defaultMetadata != null) {
            cfg.defaultMetadata = subsituteVariablesInValues(cfg.defaultMetadata, resolvedVariables);
        }
        if (cfg?.userAgent) {
            cfg.userAgent = subsituteVariables(cfg.userAgent, resolvedVariables);
        }
        debug('Replaced metadata variables in HEC config: %O', {
            defaultFields: cfg?.defaultFields,
            defaultMetadata: cfg?.defaultMetadata,
            userAgent: cfg?.userAgent,
        });
    });
}
