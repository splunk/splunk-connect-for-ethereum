export type BlockRange = {
    /** from block - inclusive */
    from: number;
    /** to block - incusive */
    to: number;
};

export function compactRanges(ranges: BlockRange[]): BlockRange[] {
    const sorted = [...ranges].sort((a, b) => a.from - b.from);
    const newRanges: BlockRange[] = [];
    for (let i = 0, len = sorted.length; i < len; i++) {
        const start = sorted[i].from;
        let maxEnd = sorted[i].to;
        while (i + 1 < len && sorted[i + 1].from - 1 <= maxEnd) {
            i++;
            maxEnd = Math.max(maxEnd, sorted[i].to);
        }
        newRanges.push({ from: start, to: maxEnd });
    }
    return newRanges;
}

export function isValidBlockNumber(n: number): boolean {
    return typeof n === 'number' && !isNaN(n) && n >= 0;
}

export function parseBlockRange(s: string): BlockRange {
    const parts = s.split('-', 2);
    const from = parseInt(parts[0]);
    const to = parseInt(parts[1]);
    if (!isValidBlockNumber(from) || !isValidBlockNumber(to) || to < from) {
        throw new Error(`Invalid block range: ${s}`);
    }
    return { from, to };
}

export function blockRangeSize(range: BlockRange): number {
    return range.to - range.from + 1;
}

export function serializeBlockRange(range: BlockRange): string {
    return `${range.from}-${range.to}`;
}

export function chunkedBlockRanges(range: BlockRange, maxRangeSize: number): BlockRange[] {
    const result = [];
    let start = range.from;
    for (; start < range.to - 2 - maxRangeSize; start += maxRangeSize) {
        result.push({ from: start, to: start + maxRangeSize - 1 });
    }
    result.push({ from: start, to: range.to });
    return result;
}

export function blockRangeToArray(range: BlockRange): number[] {
    const result = [];
    for (let b = range.from; b <= range.to; b++) {
        result.push(b);
    }
    return result;
}

export function getInverseBlockRanges(
    compactedRanges: BlockRange[],
    start: number | null,
    end: number | null
): BlockRange[] {
    if (compactedRanges.length === 0) {
        if (start != null && end != null) {
            return [{ from: start, to: end }];
        }
        return [];
    }
    const result = [];
    if (start != null && start < compactedRanges[0].from) {
        result.push({ from: start, to: compactedRanges[0].from - 1 });
    }
    for (let i = 0, len = compactedRanges.length - 1; i < len; i++) {
        result.push({ from: compactedRanges[i].to + 1, to: compactedRanges[i + 1].from - 1 });
    }
    if (end != null && end > compactedRanges[compactedRanges.length - 1].to) {
        result.push({ from: compactedRanges[compactedRanges.length - 1].to + 1, to: end });
    }
    return compactRanges(result);
}
