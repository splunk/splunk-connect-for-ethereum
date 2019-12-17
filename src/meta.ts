import { hostname } from 'os';
import { EthloggerConfig } from './config';
import { KNOWN_NETOWORK_NAMES } from './eth/networks';
import { NodePlatformAdapter } from './platforms';
import { createModuleDebug } from './utils/debug';
import { removeEmtpyValues, subsituteVariables } from './utils/obj';

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
     * for known networks from the network ID
     */
    NETWORK?: string;
    /** The ethlogger PID */
    PID: string;
    /** Ethlogger version */
    VERSION: string;
    /** The node.js version ethlogger is running on */
    NODE_VERSION: string;
    /**
     * Hostname (or IP) of the ethereum node from the transport used.
     * For HTTP transport the host portion of the host portion (without
     * port) of the URL is used.
     */
    ETH_NODE_HOSTNAME: string;
}

export function substituteVariablesInHecMetadata(
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
    const metaVariables: MetadataVariables = {
        HOSTNAME: host,
        ENODE: platformAdapter.enode ?? undefined,
        PLATFORM: platformAdapter.name,
        NETWORK_ID: networkId != null ? String(networkId) : undefined,
        NETWORK: config.eth.network ?? (networkId != null ? KNOWN_NETOWORK_NAMES[networkId] : undefined),
        PID: String(pid),
        VERSION: ethloggerVersion,
        NODE_VERSION: nodeVersion,
        ETH_NODE_HOSTNAME: transportOriginHost,
    };

    const resolvedVariables = removeEmtpyValues(metaVariables);

    Object.entries(config.hec).forEach(([name, cfg]) => {
        debug('Replacing metadata variables in HEC config %s', name);
        if (cfg && cfg.defaultFields != null) {
            cfg.defaultFields = subsituteVariables(cfg.defaultFields, resolvedVariables);
        }
        if (cfg && cfg.defaultMetadata != null) {
            cfg.defaultMetadata = subsituteVariables(cfg.defaultMetadata, resolvedVariables);
        }
        debug('Replaced metadata variables in HEC config: %O', {
            defaultFields: cfg?.defaultFields,
            defaultMetadata: cfg?.defaultMetadata,
        });
    });
}
