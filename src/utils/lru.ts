// Simplified/Typescript-ified version of https://github.com/sindresorhus/quick-lru
import { Cache } from './cache';
import { Stats } from './stats';

const initialCounters = {
    hits: 0,
    misses: 0,
};

export class LRUCache<K, V> implements Cache<K, V> {
    private cache: Map<K, V>;
    private old: Map<K, V>;
    private readonly maxSize: number;
    public size: number;
    private counters = { ...initialCounters };

    constructor({
        maxSize,
    }: {
        /**
         * The maximum number of items before evicting the least recently used items.
         * The cache will keep up to twice the amount of entries in memory.
         */
        maxSize: number;
    }) {
        this.cache = new Map();
        this.old = new Map();
        this.maxSize = maxSize;
        this.size = 0;
    }

    public has(key: K): boolean {
        const b = this.cache.has(key) || this.old.has(key);
        if (b) {
            this.counters.hits++;
        } else {
            this.counters.misses++;
        }
        return b;
    }

    public get(key: K): V | null {
        const v = this.cache.get(key);
        if (v != null) {
            this.counters.hits++;
            return v;
        }
        const ov = this.old.get(key);
        if (ov != null) {
            this.counters.hits++;
            this._set(key, ov);
            return ov;
        }
        this.counters.misses++;
        return null;
    }

    public set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.set(key, value);
        } else {
            this._set(key, value);
        }
    }

    public unset(key: K): void {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.size--;
        }
        this.old.delete(key);
    }

    private _set(key: K, value: V) {
        this.cache.set(key, value);
        this.size++;
        if (this.size >= this.maxSize) {
            this.size = 0;
            this.old = this.cache;
            this.cache = new Map();
        }
    }

    public flushStats(): Stats {
        const stats = {
            ...this.counters,
            size: this.size,
            oldSize: this.old.size,
        };
        this.counters = { ...initialCounters };
        return stats;
    }
}

export default LRUCache;
