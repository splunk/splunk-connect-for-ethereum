export function removeEmtpyValues<R extends { [k: string]: any }, I extends { [P in keyof R]: any | null | undefined }>(
    obj: I
): R {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null)) as R;
}

export function prefixKeys<T extends { [k: string]: any }>(obj: T, prefix?: string | null, removeEmtpy?: boolean): T {
    if (prefix == null || prefix === '') {
        return removeEmtpy ? removeEmtpyValues(obj) : obj;
    }
    const entries = Object.entries(obj);
    return Object.fromEntries(
        (removeEmtpy ? entries.filter(([, v]) => v != null) : entries).map(([k, v]) => [prefix + k, v])
    );
}

/**
 * Recursively (deeply) merges 2 object of the same type. It only merges plain object, not arrays.
 * It does not mutate the original object but may return references to (parts of the) orginal object.
 */
export function deepMerge<T extends { [k: string]: any }>(a: T, b: T): T {
    return Object.fromEntries([
        ...Object.entries(a).map(([k, v]) => {
            if (typeof v === 'object' && !Array.isArray(v)) {
                return [k, b[k] == null ? v : deepMerge(v, b[k] ?? {})];
            }
            return [k, b[k] ?? v];
        }),
        ...Object.entries(b).filter(([k]) => !(k in a)),
    ]);
}

export function isEmpty(obj: object): boolean {
    return obj == null || Object.values(obj).filter(v => v != null).length === 0;
}
