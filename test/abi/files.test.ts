import { loadAbiFile } from '../../src/abi/files';
import { join } from 'path';

describe('loadAbiFile', () => {
    it('loads raw ABI file', async () => {
        const result = await loadAbiFile(join(__dirname, '../abis/BCB.json'), {
            decodeAnonymous: false,
            fingerprintContracts: true,
            directory: join(__dirname, '../abis'),
            requireContractMatch: true,
            reconcileStructShapeFromTuples: false,
        });

        expect(result).toMatchSnapshot();
    });

    it('loads truffle build file', async () => {
        await expect(
            loadAbiFile(join(__dirname, '../abis/Airdropper.json'), {
                decodeAnonymous: false,
                fingerprintContracts: true,
                directory: join(__dirname, '..'),
                requireContractMatch: true,
                reconcileStructShapeFromTuples: false,
            })
        ).resolves.toMatchSnapshot();
    });

    it('loads EventEmitter.json', async () => {
        await expect(
            loadAbiFile(join(__dirname, '../abis/EventEmitter.json'), {
                decodeAnonymous: false,
                fingerprintContracts: true,
                directory: join(__dirname, '..'),
                requireContractMatch: true,
                reconcileStructShapeFromTuples: false,
            })
        ).resolves.toMatchSnapshot();
    });
});
