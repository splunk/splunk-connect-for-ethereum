import { readFile, writeFile } from 'fs-extra';
import {
    BlockRange,
    compactRanges,
    getInverseBlockRanges,
    parseBlockRange,
    serializeBlockRange,
    blockRangeIncludes,
} from './blockrange';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';
import { alwaysResolve, sleep } from './utils/async';

const { debug, info, error } = createModuleDebug('state');

export interface StateConfig {
    path: string;
    saveInterval?: number;
}

export interface Checkpoint {
    getID(): string;
    getinitialBlockNumber(): number | undefined;
    setInitialBlockNumber(blockNumber: number): void;
    markBlockComplete(blockNumber: number): void;
    markComplete(range: BlockRange): void;
    isIncomplete(block: number): boolean;
    getIncompleteRanges(latestBlock?: number): BlockRange[];
    isEmpty(): boolean;
}

class CheckpointImpl implements Checkpoint {
    private completed: BlockRange[];
    public initialBlockNumber: number | undefined;
    private saveCallback: Function;
    public id: string;

    constructor(id: string, saveFn: Function, initialBlockNumber?: number, completed: BlockRange[] = []) {
        this.id = id;
        this.initialBlockNumber = initialBlockNumber;
        this.saveCallback = saveFn;
        this.completed = completed;
    }

    public getinitialBlockNumber(): number | undefined {
        return this.initialBlockNumber;
    }

    public setInitialBlockNumber(blockNumber: number) {
        this.initialBlockNumber = blockNumber;
    }

    public getID(): string {
        return this.id;
    }

    public markBlockComplete(blockNumber: number) {
        this.markComplete({ from: blockNumber, to: blockNumber });
    }

    public markComplete(range: BlockRange) {
        this.completed = compactRanges([...this.completed, range]);
        this.saveCallback();
    }

    public isIncomplete(block: number): boolean {
        return !this.completed.some(range => blockRangeIncludes(range, block));
    }

    public getIncompleteRanges(latestBlock?: number): BlockRange[] {
        if (this.initialBlockNumber == null) {
            throw new Error('Initial block number not set');
        }
        return getInverseBlockRanges(this.completed, this.initialBlockNumber, latestBlock != null ? latestBlock : null);
    }

    public getCompletedRanges(): string[] {
        return this.completed.map(serializeBlockRange);
    }

    public isEmpty(): boolean {
        return this.completed.length === 0;
    }
}

export class State implements ManagedResource {
    private active: boolean = true;
    private readonly path: string;
    private committedVersion: number = 0;
    private pendingVersion: number = 0;
    private savePromise: Promise<void> | null = null;
    private readonly saveInterval: number;
    private checkpoints: Map<string, CheckpointImpl>;

    constructor({ path, saveInterval = 250 }: StateConfig) {
        this.path = path;
        this.saveInterval = saveInterval;
        this.checkpoints = new Map<string, CheckpointImpl>();
    }

    public async initialize() {
        try {
            const fileContents = await readFile(this.path, { encoding: 'utf-8' });
            this.initializeFromCheckpointContents(fileContents);
            info(
                'Found existing checkpoints: %o',
                Array.from(this.checkpoints).map(([, value]) => value.toString())
            );
        } catch (e) {
            if (e.code === 'ENOENT') {
                info('Checkpoint does not exist yet, starting from a clean slate');
                return;
            }
            throw new Error(`Failed to initialize checkpoints: ${e}`);
        }
    }

    public initializeFromCheckpointContents(fileContents: string) {
        const obj: any = JSON.parse(fileContents);
        if (obj.v == 1) {
            const { init, ranges } = JSON.parse(fileContents);
            if (init == null || isNaN(init)) {
                throw new Error('Invalid checkpoint file - unable to parse initial block number');
            }
            const completed = compactRanges(ranges.map(parseBlockRange));
            this.checkpoints.set('main', new CheckpointImpl('main', this.save, init, completed));

            debug('Loaded checkpoint from file with %d ranges', completed.length);
        } else if (obj.v == 2) {
            for (const k in obj) {
                if (k == 'v') {
                    continue;
                }
                const { init, ranges } = obj[k];
                const completed = compactRanges(ranges.map(parseBlockRange));
                this.checkpoints.set(k as string, new CheckpointImpl(k, this.save, init, completed));
            }
        } else {
            throw new Error(`Invalid version number in checkpoint file: ${obj}`);
        }
    }

    public getCheckpoint(id: string): Checkpoint {
        const checkpoint = this.checkpoints.get(id);
        if (checkpoint == null) {
            const newCheckpoint = new CheckpointImpl(id, this.save);
            this.checkpoints.set(id, newCheckpoint);
            return newCheckpoint;
        }
        return checkpoint;
    }

    public serialize(): string {
        const toSerialize: { [k: string]: any } = { v: 2 };
        this.checkpoints.forEach((value: CheckpointImpl) => {
            toSerialize[value.getID()] = { init: value.initialBlockNumber, ranges: value.getCompletedRanges() };
        });
        return JSON.stringify(toSerialize, null, 2);
    }

    private scheduleSave() {
        if (!this.active) {
            return;
        }
        if (this.savePromise == null) {
            const p = sleep(this.saveInterval).then(this.saveInternal);
            p.catch(e => {
                error('Scheduled save failed', e);
            });
            this.savePromise = alwaysResolve(p);
        }
    }

    private saveInternal = async () => {
        this.savePromise = null;
        const committing = this.pendingVersion;
        await writeFile(this.path, this.serialize(), { encoding: 'utf-8' });
        debug('Wrote checkpoints file to disk (committed version %d from %d)', committing, this.committedVersion);
        this.committedVersion = committing;
        if (this.pendingVersion > committing) {
            this.scheduleSave();
        }
    };

    public async save() {
        this.pendingVersion++;
        await this.savePromise;
        if (this.pendingVersion > this.committedVersion) {
            await this.saveInternal();
        }
    }

    public async shutdown() {
        this.active = false;
        await this.save();
        info('Checkpoints saved to filesystem');
    }
}
