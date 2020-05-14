import { createModuleDebug as baseCreateModuleDebug, createDebug as baseCreateDebug } from '@splunkdlt/debug-logging';

export { TRACE_ENABLED, suppressDebugLogging, enableTraceLogging } from '@splunkdlt/debug-logging';

export const createDebug = (name: string) => baseCreateDebug(`ethlogger:${name}`);

export const createModuleDebug = (name: string) => {
    return baseCreateModuleDebug(`ethlogger:${name}`);
};
