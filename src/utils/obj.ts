export function removeEmtpyValues<T extends { [k: string]: undefined | null | any }>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
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
