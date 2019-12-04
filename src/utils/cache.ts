export interface Cache<K, V> {
    has(key: K): boolean;
    get(key: K): V | null;
    set(key: K, value: V): void;
    unset(key: K): void;
}

export function cached<K, V>(key: K, cache: Cache<K, V>, producer: () => V): V {
    const v = cache.get(key);
    if (v != null) {
        return v;
    }
    const newValue = producer();
    cache.set(key, newValue);
    return newValue;
}

export class NoopCache<K, V> implements Cache<K, V> {
    has() {
        return false;
    }
    get() {
        return null;
    }
    set() {
        // ignore
    }
    unset() {
        //ignore
    }
}
