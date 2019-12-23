const ABBREVIATE_UNITS: { [k: string]: number } = {
    K: 1_000,
    M: 1_000_000,
    G: 1_000_000_000,
    T: 1_000_000_000_000,
};

export function parseAbbreviatedNumber(s: string): number {
    let rest = s;
    let factor = 1;
    const unitFactor = ABBREVIATE_UNITS[s[s.length - 1]];
    if (unitFactor != null) {
        rest = s.slice(0, -1);
        factor = unitFactor;
    }
    return parseFloat(rest) * factor;
}

/** Parses golang-formatted duration string */
export function durationStringToMs(dur: string): number {
    let millis = 0;
    let neg = false;
    const len = dur.length;
    let i = 0;
    if (dur[0] === '-') {
        neg = true;
        i++;
    } else if (dur[0] === '+') {
        i++;
    }
    while (i < len) {
        let j = i;
        do {
            const c = dur[j];
            if (!((c >= '0' && c <= '9') || c === '.')) {
                j++;
                break;
            }
        } while (++j < len);
        if (i === j) {
            // empty string
            return NaN;
        }
        const n = parseFloat(dur.slice(i, j - 1));
        if (isNaN(n)) {
            return NaN;
        }
        i = j - 1;
        const unitStr = dur.slice(i, i + 2);
        if (unitStr === 'ns') {
            millis += n / 1_000_000;
            i += 2;
        } else if (unitStr === 'us' || unitStr === 'µs' || unitStr === 'μs') {
            millis += n / 1_000;
            i += 2;
        } else if (unitStr === 'ms') {
            millis += n;
            i += 2;
        } else if (unitStr[0] === 's') {
            millis += n * 1_000;
            i += 1;
        } else if (unitStr[0] === 'm') {
            millis += n * 60_000;
            i += 1;
        } else if (unitStr[0] === 'h') {
            millis += n * 360_000;
            i += 1;
        } else {
            // not a unit
            return NaN;
        }
    }
    return millis * (neg ? -1 : 1);
}
