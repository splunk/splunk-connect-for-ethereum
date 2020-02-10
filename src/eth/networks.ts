import { readFile } from 'fs-extra';
import { join } from 'path';

// List of known networks
export const KNOWN_NETOWORK_NAMES: { [k: number]: string } = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
    42: 'kovan',
    62: 'morden',
    2018: 'dev',
};

export interface KnownNetwork {
    name: string;
    chainId: number;
    shortName: string;
    chain: string;
    network: string;
    networkId: number;
    nativeCurrency?: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpc?: string[];
    faucets?: string[];
    infoURL?: string;
}

export async function loadKnownNetworkList(): Promise<KnownNetwork[]> {
    const data = await readFile(join(__dirname, '../../data/chains.json'), { encoding: 'utf-8' });
    return JSON.parse(data);
}

export async function lookupKnownNetwork({
    chainId,
    networkId,
}: {
    chainId: number;
    networkId: number;
}): Promise<{ chain: string; network: string } | undefined> {
    const knownNetworks = await loadKnownNetworkList();
    const match = knownNetworks.find(kn => kn.chainId === chainId && kn.networkId === networkId);
    if (match != null) {
        return { chain: match.shortName, network: match.network };
    }
}
