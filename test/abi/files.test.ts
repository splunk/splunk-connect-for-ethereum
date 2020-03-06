import { loadAbiFile } from '../../src/abi/files';
import { join } from 'path';

describe('loadAbiFile', () => {
    it('loads raw ABI file', async () => {
        const result = await loadAbiFile(join(__dirname, '../abis/BCB.json'), {
            decodeAnonymous: false,
            fingerprintContracts: true,
            directory: join(__dirname, '../abis'),
        });

        expect(result).toMatchSnapshot();
    });

    it('loads truffle build file', async () => {
        await expect(
            loadAbiFile(join(__dirname, '../abis/Airdropper.json'), {
                decodeAnonymous: false,
                fingerprintContracts: true,
                directory: join(__dirname, '..'),
            })
        ).resolves.toMatchSnapshot();
    });
});
