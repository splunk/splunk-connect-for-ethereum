import { AbortHandle } from './abort';
import { createModuleDebug } from './debug';

const { error, trace } = createModuleDebug('utils:async');

export const sleep = (timeoutMS: number): Promise<void> => new Promise(resolve => setTimeout(resolve, timeoutMS));

export const delayed = <T>(task: () => Promise<T>, timeoutMS: number): Promise<T> => sleep(timeoutMS).then(task);

export const alwaysResolve = <T>(promise: Promise<T>): Promise<void> =>
    promise.then(
        () => {
            // noop
        },
        () => {
            // noop
        }
    );

export const neverResolve = <T = never>(): Promise<T> =>
    new Promise(() => {
        // noop
    });

export type ParallelTask<R> = () => Promise<R>;

type CallbackFn = (cb: () => void) => void;

class TaskWrapper<R> {
    private readonly result: Promise<R>;
    private latch: CallbackFn | null = null;
    constructor(task: ParallelTask<R>, public readonly index: number) {
        this.result = new Promise((resolve, reject) => {
            this.latch = cb => {
                const p = task();
                this.latch = null;
                alwaysResolve(p).then(cb);
                p.then(resolve, reject);
            };
        });
    }

    run(cb: () => void) {
        if (this.latch == null) {
            throw new Error('Invalid task wrapper state');
        }
        this.latch(cb);
    }

    public promise(): Promise<R> {
        return this.result;
    }
}

export function parallel<R>(
    tasks: ParallelTask<R>[],
    { maxConcurrent, abortHandle = new AbortHandle() }: { maxConcurrent: number; abortHandle?: AbortHandle }
): Promise<R[]> {
    const taskQueue = tasks.map((t, i) => new TaskWrapper<R>(t, i));
    let pending = taskQueue.length;
    let running = 0;
    const next = () => {
        while (!abortHandle.aborted && running < maxConcurrent && pending > 0) {
            const task = taskQueue.shift();
            trace(
                'Starting parallel task %d (running: %d, pending: %d, aborted: %o)',
                task?.index,
                running,
                pending,
                abortHandle.aborted
            );
            running++;
            pending--;
            if (task == null) {
                error('Illegal state: found null item in task queue');
                return;
            }
            task.run(() => {
                trace('Parallel task completed %d', task.index);
                running--;
                next();
            });
        }
    };
    const allCompletePromise = abortHandle.race(Promise.all(taskQueue.map(t => t.promise())));
    next();
    return allCompletePromise;
}
