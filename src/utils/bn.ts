const MAX_NUMBER = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_NUMBER = BigInt(Number.MIN_SAFE_INTEGER);

/**
 * Parses the given input using JS's native BigInt and returns a number or a string depending on the size of the number.
 * @param input
 * @returns the value as number if it is safe to do so (given JS's number precision) - otherwise returns a string
 */
export function parseBigInt(input: number | string): number | string {
    if (input == null || input === '') {
        throw new Error('Cannot convert empty value to BigInt');
    }
    const n = BigInt(input);
    return n <= MAX_NUMBER && n >= MIN_NUMBER ? parseInt(n.toString(10), 10) : n.toString(10);
}

/**
 * Parses the given input using JS's native BigInt and returns a number.
 * If the value exeeds the safe bounds of integers in JS it will throw an error.
 * @param input
 */
export function bigIntToNumber(input: number | string): number {
    const n = BigInt(input);
    if (n > MAX_NUMBER || n < MIN_NUMBER) {
        throw new Error(`BigInt overflow for "${input}" - cannot convert to number`);
    }
    return parseInt(n.toString(10), 10);
}
