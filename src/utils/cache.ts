export interface Cache<K, V> {
    has(key: K): boolean;
    get(key: K): V | null;
    set(key: K, value: V): void;
    unset(key: K): void;
    size: number;
}

export function cached<K, V>(key: K, cache: Cache<K, V>, producer: (k: K) => V): V {
    const v = cache.get(key);
    if (v != null) {
        return v;
    }
    const newValue = producer(key);
    cache.set(key, newValue);
    return newValue;
}

export async function cachedAsync<K, V>(
    key: K,
    cache: Cache<K, Promise<V>>,
    producer: (k: K) => Promise<V>
): Promise<V> {
    const p = cache.get(key);
    if (p != null) {
        return p;
    }

    const newValue = producer(key);
    cache.set(key, newValue);
    try {
        return await newValue;
    } catch (e) {
        cache.unset(key);
        throw e;
    }
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
    size = 0;
}
