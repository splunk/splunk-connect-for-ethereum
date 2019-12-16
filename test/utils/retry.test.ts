import { AbortManager } from '../../src/utils/abort';
import { retry, exponentialBackoff, resolveWaitTime, linearBackoff } from '../../src/utils/retry';

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
        const abortManager = new AbortManager();
        const onAbort = () => {
            abortManager.abort();
        };
        const p = retry(
            async () => {
                tried++;
                if (tried >= 5) {
                    setTimeout(onAbort, 0);
                }
                throw new Error('nope');
            },
            { waitBetween: 3, abortManager }
        );

        await expect(p).rejects.toMatchInlineSnapshot(`Symbol([[ABORT]])`);
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(12);
        expect(tried).toBeGreaterThanOrEqual(5);
        expect(tried).toBeLessThan(15);
    });
});

test('exponentialBackoff', () => {
    const waitTimeFn = exponentialBackoff({ min: 10, max: 120_000 });

    const times = (n: number, fn: () => void) => {
        for (let i = 0; i < n; i++) {
            fn();
        }
    };
    times(100, () => {
        const wait1 = resolveWaitTime(waitTimeFn, 1);
        expect(wait1).toBeGreaterThanOrEqual(0);
        expect(wait1).toBeLessThanOrEqual(20);
    });
    times(100, () => {
        const wait2 = resolveWaitTime(waitTimeFn, 2);
        expect(wait2).not.toBeNaN();
        expect(wait2).toBeGreaterThanOrEqual(0);
        expect(wait2).toBeLessThanOrEqual(40);
    });
    times(100, () => {
        const waitN = resolveWaitTime(waitTimeFn, 16);
        expect(waitN).not.toBeNaN();
        expect(waitN).toBeGreaterThanOrEqual(0);
        expect(waitN).toBeLessThanOrEqual(120_000);
    });
});

test('linearBackoff', () => {
    const waitTimeFn = linearBackoff({ min: 0, step: 10000, max: 120_000 });

    expect(resolveWaitTime(waitTimeFn, 1)).toMatchInlineSnapshot(`0`);
    expect(resolveWaitTime(waitTimeFn, 2)).toMatchInlineSnapshot(`10000`);
    expect(resolveWaitTime(waitTimeFn, 10)).toMatchInlineSnapshot(`90000`);
    expect(resolveWaitTime(waitTimeFn, 12)).toMatchInlineSnapshot(`110000`);
    expect(resolveWaitTime(waitTimeFn, 13)).toMatchInlineSnapshot(`120000`);
    expect(resolveWaitTime(waitTimeFn, 100)).toMatchInlineSnapshot(`120000`);
});
