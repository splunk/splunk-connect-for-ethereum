export type BlockRange = {
    /** from block - inclusive */
    from: number;
    /** to block - incusive */
    to: number;
};

/**
 * Attempts to combine overlapping and adjacent block ranges to create
 * fewer ranges covering the same blocks. Also sorts block ranges in
 * ascending order.
 */
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

/** Number of blocks in the given `range` */
export function blockRangeSize(range: BlockRange): number {
    return range.to - range.from + 1;
}

export function serializeBlockRange(range: BlockRange): string {
    return `${range.from}-${range.to}`;
}

/** Creates chunks of up to `maxChunkSize` covering the same blocks as the original range */
export function chunkedBlockRanges(
    range: BlockRange,
    maxChunkSize: number,
    maxChunks: number = Infinity
): BlockRange[] {
    const result = [];
    let start = range.from;
    for (; start < range.to - 2 - maxChunkSize && result.length < maxChunks; start += maxChunkSize) {
        result.push({ from: start, to: start + maxChunkSize - 1 });
    }
    if (result.length < maxChunks) {
        result.push({ from: start, to: range.to });
    }
    return result;
}

/** Returns an array of individual block numbers in the block range */
export function blockRangeToArray(range: BlockRange): number[] {
    const result = [];
    for (let b = range.from; b <= range.to; b++) {
        result.push(b);
    }
    return result;
}

/**
 * Returns the block ranges not covered by the given `compatedRanges`
 * (ie. the gaps) between `start` and `end` blocks.
 */
export function getInverseBlockRanges(
    compactedRanges: BlockRange[],
    start: number | null,
    end: number | null
): BlockRange[] {
    if (start != null && end != null && start >= end) {
        return [];
    }
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

export const blockRangeIncludes = (range: BlockRange, block: number): boolean =>
    block >= range.from && block <= range.to;
