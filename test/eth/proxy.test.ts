import { isMinimalProxyContract, getMinimalProxyContractDelegateAddress } from '../../src/eth/proxy';
import { ContractBytecode } from '../../src/eth/evm';

test('isMinimalProxyContract', () => {
    expect(
        isMinimalProxyContract(
            new ContractBytecode(
                '0x363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3'
            )
        )
    ).toBe(true);
    expect(
        isMinimalProxyContract(
            new ContractBytecode(
                '0x363d3d373d3d3d363d731234bebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3'
            )
        )
    ).toBe(true);
});

test('getMinimalProxyContractDelegateAddress', () => {
    expect(
        getMinimalProxyContractDelegateAddress(
            new ContractBytecode(
                '0x363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3'
            )
        )
    ).toMatchInlineSnapshot(`"0xBEbeBeBEbeBebeBeBEBEbebEBeBeBebeBeBebebe"`);
    expect(
        getMinimalProxyContractDelegateAddress(
            new ContractBytecode(
                '0x363d3d373d3d3d363d731234bebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3'
            )
        )
    ).toMatchInlineSnapshot(`"0x1234bEBEBebEBEbebeBEbEbEbEbEbebEBeBebEbe"`);
});
