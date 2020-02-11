import { debug as create } from 'debug';

export let TRACE_ENABLED: boolean = false;

// eslint-disable-next-line no-console
create.log = console.error.bind(console);

export const createDebug = (name: string) => create(`ethlogger:${name}`);

export const createModuleDebug = (name: string) => {
    const base = createDebug(name);
    const debug = base.extend('debug');
    const error = base.extend('error');
    error.enabled = true;
    const warn = base.extend('warn');
    warn.enabled = true;
    const info = base.extend('info');
    info.enabled = true;
    const traceFn = base.extend('trace');
    const trace = (msg: any, ...args: any[]) => (TRACE_ENABLED ? traceFn(msg, ...args) : undefined);
    return { debug, info, warn, error, trace };
};

export function enableTraceLogging() {
    TRACE_ENABLED = true;
}

// disable debug logging for tests
export function suppressDebugLogging() {
    const logs: any[][] = [];
    create.log = (...args: any[]) => {
        /* noop */
        logs.push(args);
    };

    return {
        logs,
        restore: (): any[][] => {
            // eslint-disable-next-line no-console
            create.log = console.error.bind(console);
            return logs;
        },
    };
}
