import { AbortHandle } from '../../src/utils/abort';
import { sleep } from '../../src/utils/async';

test('AbortablePromise', async () => {
    const abort = new AbortHandle();

    const p1 = abort.race(sleep(10).then(() => 'RESULT1'));
    await expect(p1).resolves.toMatchInlineSnapshot(`"RESULT1"`);

    const p2 = abort.race(sleep(5000).then(() => 'RESULT2'));

    expect(abort.aborted).toBe(false);
    setTimeout(() => abort.abort(), 10);

    await expect(p2).rejects.toMatchInlineSnapshot(`Symbol([[ABORT]])`);
    expect(abort.aborted).toBe(true);
});
