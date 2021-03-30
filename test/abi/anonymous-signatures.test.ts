import { getInputSize } from '../../src/abi/decode';
import { loadSignatureFile } from '../../src/abi/files';

test('getInputSize for all anonymous signatures', async () => {
    const sigs = await loadSignatureFile('data/fns.abisigs.gz');
    for (const abis of sigs.entries.map(i => i[1])) {
        for (const abi of abis) {
            expect(() => getInputSize(abi)).not.toThrow();
        }
    }
});
