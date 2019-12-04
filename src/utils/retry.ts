import { createModuleDebug } from './debug';
import { sleep, neverResolve } from './async';
import { AbortSignal } from 'abort-controller';

const { debug } = createModuleDebug('utils:retry');

export type WaitTimeFn = (attempt: number) => number;

export type WaitTime = WaitTimeFn | number;

export function resolveWaitTime(waitTime: WaitTime, attempt: number): number {
    return typeof waitTime === 'function' ? waitTime(attempt) : waitTime;
}

export const RETRY_ABORT = new Error('Retry abort');

export async function retry<R>(
    task: () => Promise<R>,
    {
        attempts = Infinity,
        waitBetween = 1000,
        taskName = 'anonymous task',
        onRetry,
        abortSignal,
    }: {
        attempts?: number;
        waitBetween?: WaitTime;
        taskName?: string;
        onRetry?: (attempt: number) => void;
        abortSignal?: AbortSignal;
    } = {}
): Promise<R> {
    const startTime = Date.now();
    let attempt = 0;
    let aborted = false;
    const abortPromise: Promise<void> =
        abortSignal != null
            ? new Promise(resolve => {
                  abortSignal.addEventListener('abort', () => {
                      aborted = true;
                      resolve();
                  });
              })
            : neverResolve();

    while (attempt < attempts) {
        if (aborted) {
            debug('[%s] Received abort signal', taskName);
            throw new Error(`Retry loop aborted [${taskName}]`);
        }
        attempt++;
        if (attempt > 1) {
            debug(`[%s] Retrying attempt %d`, taskName, attempt);
        }
        try {
            if (attempt > 1 && onRetry != null) {
                onRetry(attempt);
            }
            const res = await task();
            debug('Task %s succeeded after %d ms at attempt# %d', taskName, Date.now() - startTime, attempt);
            return res;
        } catch (e) {
            if (e === RETRY_ABORT) {
                debug('[%s] Retry loop aborted', taskName);
                break;
            }
            debug('[%s] Task failed: ', taskName, e.message);
            if (attempt < attempts && !aborted) {
                const waitTime = resolveWaitTime(waitBetween, attempt);
                debug('[%s] Waiting for %d ms before retrying', taskName, waitTime);
                await Promise.race([sleep(waitTime), abortPromise]);
            } else {
                throw e;
            }
        }
    }
    throw new Error(`Retry loop ended [${taskName}]`);
}

export const exponentialBackoff = ({ min, max }: { min: number; max?: number }): WaitTimeFn => (attempt: number) => {
    const t = Math.round(Math.random() * min * Math.pow(2, attempt));
    return max != null ? Math.min(max, t) : t;
};
