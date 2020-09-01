import { Address } from '../msgs';
import { ContractBytecode, OPCODE_DELEGATECALL } from './evm';
import { EthereumClient } from './client';
import { getStorageAt } from './requests';
import { abiDecodeParameters, toChecksumAddress } from '../abi/wasm';
import { createModuleDebug } from '../utils/debug';

const { warn, debug, info, trace } = createModuleDebug('abi:proxy');

const EIP1967_STORAGE_SLOT = `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`;
// const EIP1822_STORAGE_SLOT = `0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7`;
const EIP1167_BYTECODE = `363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3`;

const STORAGE_EMPTY = '0x0000000000000000000000000000000000000000000000000000000000000000';

export enum ProxyContractType {
    EIP1167,
    EIP1967,
    EIP1822,
}

export function isMinimalProxyContract(contractCode: ContractBytecode): boolean {
    const code = contractCode.bytecode;
    if (code.length === EIP1167_BYTECODE.length) {
        return code.slice(0, 20) === EIP1167_BYTECODE.slice(0, 20) && code.slice(1, 1) === EIP1167_BYTECODE.slice(1, 1);
    }
    return false;
}

export function getMinimalProxyContractDelegateAddress(contractCode: ContractBytecode): Address {
    //
    return toChecksumAddress('0x' + contractCode.bytecode.slice(22, 62));
}

export async function isTransparentProxy(
    contractCode: ContractBytecode,
    address: Address,
    eth: EthereumClient
): Promise<boolean> {
    trace('Determining if contract %s is a proxy', address);
    if (contractCode.hasOpcode(OPCODE_DELEGATECALL) && contractCode.hasFunctionSignature('implementation()')) {
        trace('Contract %s contains DELEGATECALL opcode and has implementation() function', address);
        const storageVal = await eth.request(getStorageAt(address, EIP1967_STORAGE_SLOT, 'latest'));
        debug('Found storage value %s at EIP1967_STORAGE_SLOT for contract %s', storageVal, address);
        if (storageVal != null && storageVal !== STORAGE_EMPTY) {
            trace('Contract %s appears to be a transparent proxy', address);
            return true;
        }
    }
    trace('Contract %s does not seem be to be transparent proxy', address);
    return false;
}

export async function getTransparentProxyImplementationAddress(
    address: Address,
    block: number | 'latest',
    eth: EthereumClient
): Promise<Address | undefined> {
    const storage: string = await eth.request(getStorageAt(address, EIP1967_STORAGE_SLOT, block));
    if (storage != null && storage !== STORAGE_EMPTY) {
        const decodedValues = abiDecodeParameters(storage.slice(2), ['address']);
        if (decodedValues.length === 1 && typeof decodedValues[0] === 'string') {
            return decodedValues[0];
        }
    }

    return undefined;
}

export interface ProxyContractInfo {
    type: ProxyContractType;
    implementation?: Address;
}

export async function detectProxyContract(
    contractAddress: Address,
    contractCode: ContractBytecode,
    ethClient: EthereumClient
): Promise<ProxyContractInfo | undefined> {
    if (isMinimalProxyContract(contractCode)) {
        return {
            type: ProxyContractType.EIP1167,
            implementation: getMinimalProxyContractDelegateAddress(contractCode),
        };
    }
    if (await isTransparentProxy(contractCode, contractAddress, ethClient)) {
        return {
            type: ProxyContractType.EIP1967,
        };
    }

    return undefined;
}

// export async function getProxyImplementationAddress(
//     contractAddress: Address,
//     contractCode: ContractBytecode,
//     proxyInfo: ProxyContractInfo,
//     block: number,
//     ethClient: EthereumClient
// ): Promise<Address | undefined> {
//     switch (proxyInfo.type) {
//         case ProxyContractType.EIP1167:
//             // implementation address won't change
//             return proxyInfo.implementation!;
//         // case ProxyContractType.EIP1967:
//         //     return getDelegateProxyContractAddress();
//     }
// }
