export interface AbortPromise extends PromiseLike<never> {
    aborted: boolean;
    abort(): void;
}

export const ABORT = '[[ABORT]]';

export class AbortablePromise implements AbortPromise {
    public aborted: boolean = false;
    private p: Promise<never>;
    private triggerAbort: null | (() => void) = null;
    constructor() {
        this.p = new Promise<never>((_, reject) => {
            this.triggerAbort = () => {
                reject(ABORT);
                this.aborted = true;
                this.triggerAbort = () => {
                    // noop
                };
            };
        });
    }

    public abort() {
        if (this.triggerAbort != null) {
            this.triggerAbort();
        }
    }

    public then<never, TResult2 = never>(
        onfulfilled?: ((value: never) => never | PromiseLike<never>) | undefined | null,
        onrejected?: ((reason: any) => never | PromiseLike<never>) | undefined | null
    ): Promise<never> {
        return this.p.then(onfulfilled, onrejected);
    }
}

export function raceAbort<T>(promise: Promise<T>, abort?: AbortPromise): Promise<T> {
    if (abort == null) {
        return promise;
    }
    return Promise.race([promise, Promise.resolve(abort)]);
}

export class AbortManager {
    public aborted: boolean = false;
    private handles: Set<AbortPromise> = new Set();

    public get size() {
        return this.handles.size;
    }

    public abort() {
        this.aborted = true;
        for (const handle of this.handles.values()) {
            handle.abort();
        }
        this.handles.clear();
    }

    public async withAbort<T>(fn: (abort: AbortPromise) => Promise<T>): Promise<T> {
        if (this.aborted) {
            return Promise.reject(ABORT);
        }
        const abort = new AbortablePromise();
        this.handles.add(abort);
        try {
            return await fn(abort);
        } finally {
            this.handles.delete(abort);
        }
    }

    public race<T>(p: Promise<T>): Promise<T> {
        return this.withAbort(abort => raceAbort(p, abort));
    }
}
