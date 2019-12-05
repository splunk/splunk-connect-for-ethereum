import { retry } from '../../src/utils/retry';
import AbortController from 'abort-controller';

describe('retry', () => {
    it('retries 5 times, then rejects', async () => {
        let tried = 0;
        const startTime = Date.now();
        const p = retry(
            async () => {
                tried++;
                throw new Error('nope');
            },
            { attempts: 5, waitBetween: 1 }
        );

        await expect(p).rejects.toMatchInlineSnapshot(`[Error: nope]`);
        expect(tried).toBe(5);
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(5);
        expect(Date.now() - startTime).toBeLessThan(100);
    });

    it('retries 5 times, returns result', async () => {
        let tried = 0;
        const startTime = Date.now();
        const p = retry(
            async () => {
                tried++;
                if (tried > 4) {
                    return 'RESULT';
                } else {
                    throw new Error('nope');
                }
            },
            { attempts: 5, waitBetween: 1 }
        );

        await expect(p).resolves.toMatchInlineSnapshot(`"RESULT"`);
        expect(tried).toBe(5);
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(5);
        expect(Date.now() - startTime).toBeLessThan(100);
    });

    it('aborts', async () => {
        let tried = 0;
        const startTime = Date.now();
        const abort = new AbortController();
        const onAbort = () => {
            abort.abort();
        };
        const p = retry(
            async () => {
                tried++;
                if (tried >= 5) {
                    setTimeout(onAbort, 0);
                }
                throw new Error('nope');
            },
            { waitBetween: 3, abortSignal: abort.signal }
        );

        await expect(p).rejects.toMatchInlineSnapshot(`[Error: Retry loop aborted [anonymous task]]`);
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(15);
        expect(tried).toBeGreaterThanOrEqual(5);
        expect(tried).toBeLessThan(15);
    });
});
