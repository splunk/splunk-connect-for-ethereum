import { createModuleDebug } from './debug';

const { debug, error } = createModuleDebug('utils:resource');

export interface ManagedResource {
    shutdown(maxTime?: number): Promise<void>;
}

export async function shutdownAll(resources: ManagedResource[], maxTime: number): Promise<boolean> {
    let cleanShutdown = true;
    debug('About to shut down %d resource within max time of %d ms', resources.length, maxTime);
    const startTime = Date.now();
    const targetShutdownTime = startTime + maxTime;
    for (const resource of resources) {
        const remainingShutdownTime = Date.now() - targetShutdownTime;
        try {
            await resource.shutdown(remainingShutdownTime > 0 ? remainingShutdownTime : undefined);
        } catch (e) {
            error('Caught error attempting to shutdown resource', e);
            cleanShutdown = false;
        }
    }
    debug('%s shutdown completed in %d ms', cleanShutdown ? 'Clean' : 'Dirty', Date.now() - startTime);
    return cleanShutdown;
}
