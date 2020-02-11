const replaceAll = (s: string, search: string, repl: string): string => s.split(search).join(repl);

export function subsituteVariables(v: string, variables: { [name: string]: string }): string {
    const varEntries = Object.entries(variables).map(([k, v]) => [`$${k}`, v]);
    if (varEntries.length === 0) {
        return v;
    }
    return varEntries.reduce((cur, [variable, repl]) => replaceAll(cur, variable, repl), v);
}

/** Substitutes variable placeholders in all (string) values of the given object */
export function subsituteVariablesInValues<T = { [k: string]: string }>(
    obj: T,
    variables: { [name: string]: string }
): T {
    const varEntries = Object.entries(variables).map(([k, v]) => [`$${k}`, v]);
    if (varEntries.length === 0) {
        return obj;
    }
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, varEntries.reduce((cur, [variable, repl]) => replaceAll(cur, variable, repl), v)])
            .filter(([, v]) => !!v)
    );
}
