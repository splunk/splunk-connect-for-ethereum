import { AbortSignal } from 'abort-controller';

export const sleep = (timeoutMS: number): Promise<void> => new Promise(resolve => setTimeout(resolve, timeoutMS));

export const neverResolve = <T>(): Promise<T> =>
    new Promise(() => {
        // noop
    });

export type ParallelTask<R> = () => Promise<R>;

export function parallel<R>(
    tasks: ParallelTask<R>[],
    { maxConcurrent, abortSignal }: { maxConcurrent: number; abortSignal?: AbortSignal }
): Promise<R[]> {
    return new Promise<R[]>((resolve, reject) => {
        let aborted = false;
        if (abortSignal != null)
            abortSignal.addEventListener('abort', () => {
                aborted = true;
                resolve();
            });
        let running = 0;
        let pending = tasks.length;
        const results: R[] = [];
        const run = (idx: number, next: () => void) => {
            running++;
            const p = tasks[idx]();
            p.then(
                res => {
                    running--;
                    pending--;
                    results[idx] = res;
                    next();
                },
                e => {
                    reject(e);
                }
            );
        };
        let cur = 0;
        const next = () => {
            if (aborted) {
                reject(new Error('Aborted'));
                return;
            }
            if (pending === 0) {
                resolve(results);
            }
            while (cur < tasks.length && running < maxConcurrent) {
                run(cur++, next);
            }
        };
        next();
    });
}

export function alwaysResolve<T>(promise: Promise<T>): Promise<void> {
    return promise.then(
        () => {
            // noop
        },
        () => {
            // noop
        }
    );
}
