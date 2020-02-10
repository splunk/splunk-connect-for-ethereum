import { readFile, writeFile } from 'fs-extra';
import {
    BlockRange,
    compactRanges,
    getInverseBlockRanges,
    parseBlockRange,
    serializeBlockRange,
    blockRangeSize,
    blockRangeIncludes,
} from './blockrange';
import { createModuleDebug } from './utils/debug';
import { ManagedResource } from './utils/resource';
import { alwaysResolve, sleep } from './utils/async';

const { debug, info, error } = createModuleDebug('checkpoint');

export interface CheckpointConfig {
    path: string;
    initialBlockNumber?: number;
    saveInterval?: number;
}

export class Checkpoint implements ManagedResource {
    private active: boolean = true;
    private completed: BlockRange[] = [];
    public initialBlockNumber: number | undefined;
    private readonly path: string;
    private committedVersion: number = 0;
    private pendingVersion: number = 0;
    private savePromise: Promise<void> | null = null;
    private readonly saveInterval: number;

    constructor({ initialBlockNumber, path, saveInterval = 250 }: CheckpointConfig) {
        this.initialBlockNumber = initialBlockNumber;
        this.path = path;
        this.saveInterval = saveInterval;
    }

    public async initialize() {
        try {
            const fileContents = await readFile(this.path, { encoding: 'utf-8' });
            this.initializeFromCheckpointContents(fileContents);
            info('Found existing checkpoints: %o', {
                initialBlockNumber: this.initialBlockNumber,
                completedBlockCount: this.completed.map(blockRangeSize).reduce((a, b) => a + b, 0),
            });
        } catch (e) {
            if (e.code === 'ENOENT') {
                info('Checkpoint does not exist yet, starting from a clean slate');
                return;
            }
            throw new Error(`Failed to initialize checkpoints: ${e}`);
        }
    }

    public initializeFromCheckpointContents(fileContents: string) {
        const { v, init, ranges } = JSON.parse(fileContents);
        if (v !== 1) {
            throw new Error(`Invalid version number in checkpoint file: ${v}`);
        }
        if (init == null || isNaN(init)) {
            throw new Error('Invalid checkpoint file - unable to parse inital block number');
        }
        this.initialBlockNumber = init;
        this.completed = compactRanges(ranges.map(parseBlockRange));
        debug('Loaded checkpoint from file with %d ranges', this.completed.length);
    }

    public markBlockComplete(blockNumber: number) {
        this.markComplete({ from: blockNumber, to: blockNumber });
    }

    public markComplete(range: BlockRange) {
        if (!this.active) {
            throw new Error('Checkpoint has already been shut down');
        }
        this.completed = compactRanges([...this.completed, range]);
        this.pendingVersion++;
        this.scheduleSave();
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

    public isEmpty(): boolean {
        return this.completed.length === 0;
    }

    public serialize(): string {
        return JSON.stringify(
            { v: 1, init: this.initialBlockNumber, ranges: this.completed.map(serializeBlockRange) },
            null,
            2
        );
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
