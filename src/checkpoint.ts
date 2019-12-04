import { ManagedResource } from './utils/resource';
import { readFile, writeFile } from 'fs-extra';
import { createModuleDebug } from './utils/debug';
import { BlockRange, compactRanges, parseBlockRange, getInverseBlockRanges, serializeBlockRange } from './blockrange';

const { debug } = createModuleDebug('checkpoint');

export interface BlockRangeCheckpointConfig {
    path: string;
    initialBlockNumber?: number;
}

export class BlockRangeCheckpoint implements ManagedResource {
    private active: boolean = true;
    private completed: BlockRange[] = [];
    public initialBlockNumber: number | undefined;
    private readonly path: string;

    constructor(config: BlockRangeCheckpointConfig) {
        this.initialBlockNumber = config.initialBlockNumber;
        this.path = config.path;
    }

    public async initialize() {
        try {
            const fileContents = await readFile(this.path, { encoding: 'utf-8' });
            this.initializeFromCheckpointContents(fileContents);
        } catch (e) {
            if (e.code === 'ENOENT') {
                debug('Checkpoint does not exist yet, starting with empty ranges');
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

    public async save() {
        await writeFile(this.path, this.serialize(), { encoding: 'utf-8' });
    }

    public async shutdown() {
        this.active = false;
        await this.save();
        debug('Checkpoints saved to filesystem');
    }
}
