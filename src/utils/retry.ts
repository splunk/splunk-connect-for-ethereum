import { ABORT, AbortHandle } from './abort';
import { sleep } from './async';
import { createModuleDebug } from './debug';

const { debug, warn } = createModuleDebug('utils:retry');

/** A function dynamically computing the time to wait beteween retry attempts */
export type WaitTimeFn = (attempt: number) => number;

/** Wait time is either a function (WaitTimeFn) or an absolute number */
export type WaitTime = WaitTimeFn | number;

/** Retruens the number of milliseonds to wait for a given waitTime and attempt number (1-based) */
export function resolveWaitTime(waitTime: WaitTime, attempt: number): number {
    return typeof waitTime === 'function' ? waitTime(attempt) : waitTime;
}

/** Can be thrown by retryable task to abort retry loop */
export const RETRY_ABORT = Symbol('[[RETRY ABORT]]');

export class RetryTimeoutError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

export async function retry<R>(
    task: () => Promise<R>,
    {
        attempts = Infinity,
        waitBetween = 1000,
        taskName = 'anonymous task',
        onRetry,
        onError,
        abortHandle = new AbortHandle(),
        warnOnError = false,
        timeout,
    }: {
        attempts?: number;
        waitBetween?: WaitTime;
        taskName?: string;
        onRetry?: (attempt: number) => void;
        onError?: <E extends Error>(e: E, attempt: number) => void;
        abortHandle?: AbortHandle;
        warnOnError?: boolean;
        timeout?: number;
    } = {}
): Promise<R> {
    const startTime = Date.now();
    let attempt = 0;
    while (attempt < attempts) {
        if (abortHandle.aborted) {
            debug('[%s] Received abort signal', taskName);
            throw RETRY_ABORT;
        }
        attempt++;
        if (attempt > 1) {
            debug(`[%s] Retrying attempt %d`, taskName, attempt);
        }
        try {
            if (attempt > 1 && onRetry != null) {
                onRetry(attempt);
            }
            const res = await abortHandle.race(task());
            debug('Task %s succeeded after %d ms at attempt# %d', taskName, Date.now() - startTime, attempt);
            return res;
        } catch (e) {
            if (onError != null) {
                onError(e, attempt);
            }
            if (e === RETRY_ABORT || e === ABORT) {
                debug('[%s] Retry loop aborted', taskName);
                throw RETRY_ABORT;
            }
            (warnOnError ? warn : debug)('Task %s failed: %s', taskName, e.toString());
            if (abortHandle.aborted) {
                throw RETRY_ABORT;
            }
            if (timeout != null && Date.now() - startTime > timeout) {
                throw new RetryTimeoutError(e.toString());
            }
            if (attempt < attempts) {
                const waitTime = resolveWaitTime(waitBetween, attempt);
                debug('[%s] Waiting for %d ms before retrying', taskName, waitTime);
                await abortHandle.race(sleep(waitTime));
            } else {
                throw e;
            }
        }
    }
    throw new Error(`Retry loop ended [${taskName}]`);
}

export const exponentialBackoff = ({ min, max }: { min: number; max?: number }): WaitTimeFn =>
    function exponentialBackoffFn(attempt: number) {
        const t = Math.round(Math.random() * min * Math.pow(2, attempt));
        return max != null ? Math.min(max, t) : t;
    };

export const linearBackoff = ({ min, max, step }: { min: number; max: number; step: number }): WaitTimeFn =>
    function linearBackoffFn(attempt: number) {
        return Math.min(max, min + (attempt - 1) * step);
    };
