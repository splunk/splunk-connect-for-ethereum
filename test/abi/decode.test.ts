import { getInputSize } from '../../src/abi/decode';
import { loadSignatureFile } from '../../src/abi/files';

test('getInputSize for all anonymous signatures', async () => {
    const sigs = await loadSignatureFile('data/fns.abisigs.gz');
    for (const abis of sigs.entries.map(i => i[1])) {
        for (const abi of abis) {
            expect(() => getInputSize(abi)).not.toThrow();
        }
    }

    // TODO: Add check we're prioritizing signatures in our anonymous db properely

    // const collisions = sigs.entries.filter(([sig, items]) => items.length > 1);
    // console.log(
    //     collisions
    //         .map(
    //             ([sig, items]) =>
    //                 '--> ' +
    //                 sig +
    //                 '\n' +
    //                 sortAbis(items)
    //                     .map(i => '\t' + computeSignature(i) + ' - ' + JSON.stringify(getInputSize(i)))
    //                     .join('\n')
    //         )
    //         .join('\n\n')
    // );
});
