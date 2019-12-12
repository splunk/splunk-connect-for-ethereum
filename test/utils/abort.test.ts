import { AbortablePromise, raceAbort } from '../../src/utils/abort';
import { sleep } from '../../src/utils/async';

test('AbortablePromise', async () => {
    const abort = new AbortablePromise();

    const p1 = raceAbort(
        sleep(10).then(() => 'RESULT1'),
        abort
    );
    await expect(p1).resolves.toMatchInlineSnapshot(`"RESULT1"`);

    const p2 = raceAbort(
        sleep(5000).then(() => 'RESULT2'),
        abort
    );

    expect(abort.aborted).toBe(false);
    setTimeout(() => abort.abort(), 10);

    await expect(p2).rejects.toMatchInlineSnapshot(`Symbol([[ABORT]])`);
    expect(abort.aborted).toBe(true);
});
