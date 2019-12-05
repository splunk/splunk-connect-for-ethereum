// Simplified/Typescript-ified version of https://github.com/sindresorhus/quick-lru
import { Cache } from './cache';

export default class LRUCache<K, V> implements Cache<K, V> {
    private cache: Map<K, V>;
    private old: Map<K, V>;
    private readonly maxSize: number;
    private size: number;

    constructor({
        maxSize,
    }: {
        /** The maximum number of items before evicting the least recently used items  */
        maxSize: number;
    }) {
        this.cache = new Map();
        this.old = new Map();
        this.maxSize = maxSize;
        this.size = 0;
    }

    public has(key: K): boolean {
        return this.cache.has(key) || this.old.has(key);
    }

    public get(key: K): V | null {
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        if (this.old.has(key)) {
            const value = this.old.get(key);
            this._set(key, value!);
            return value!;
        }

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
}
