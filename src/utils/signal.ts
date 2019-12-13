import { createModuleDebug } from './debug';

const { debug, warn } = createModuleDebug('signal');

export type Signal = 'SIGINT' | 'SIGTERM' | 'SIGHUP';

export function waitForSignal(signal: Signal): Promise<void> {
    return new Promise(resolve => {
        debug('Listening on signal %s', signal);
        process.once(signal, () => {
            warn(`Received signal ${signal}`);
            resolve();
        });
    });
}
