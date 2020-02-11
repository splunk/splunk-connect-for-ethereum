import { join } from 'path';
import { computeContractFingerprint, extractFunctionsAndEvents } from '../../src/abi/contract';
import { AbiRepository } from '../../src/abi/repo';
import { readFile } from 'fs-extra';

test('extractFunctionsAndEvents', async () => {
    const config = {
        decodeAnonymous: false,
        fingerprintContracts: true,
        abiFileExtension: '.json',
    };
    const abis = new AbiRepository(config);
    await abis.loadAbiFile(join(__dirname, '../abis/BCB.json'), config);
    const fne = extractFunctionsAndEvents(
        await readFile(join(__dirname, '../fixtures/contract1.txt'), { encoding: 'utf-8' }),
        (sig: string) => abis.getMatchingSignatureName(sig)
    );
    expect(fne).toMatchInlineSnapshot(`
        Object {
          "events": Array [
            "Approval(address,address,uint256)",
            "OwnershipTransferred(address,address)",
            "Transfer(address,address,uint256)",
            "TransferWithData(address,address,uint256,bytes)",
          ],
          "functions": Array [
            "allowance(address,address)",
            "approve(address,uint256)",
            "balanceOf(address)",
            "burn(address,uint256)",
            "decimals()",
            "decreaseAllowance(address,uint256)",
            "increaseAllowance(address,uint256)",
            "isOwner()",
            "mint(address,uint256)",
            "name()",
            "owner()",
            "renounceOwnership()",
            "symbol()",
            "totalSupply()",
            "transfer(address,uint256)",
            "transferFrom(address,address,uint256)",
            "transferOwnership(address)",
            "transferWithData(address,uint256,bytes)",
          ],
        }
    `);

    expect(computeContractFingerprint(fne)).toMatchInlineSnapshot(
        `"30f0d1068a77a3aaa446f680f4aa961c9e981bff9aba4a0962230867d0f3ddf9"`
    );
});
