import {
    compactRanges,
    parseBlockRange,
    chunkedBlockRanges,
    blockRangeSize,
    getInverseBlockRanges,
} from '../src/blockrange';

test('compactRanges', () => {
    expect(
        compactRanges([
            { from: 1, to: 5 },
            { from: 3, to: 8 },
        ])
    ).toEqual([{ from: 1, to: 8 }]);

    expect(
        compactRanges([
            { from: 101, to: 101 },
            { from: 102, to: 102 },
            { from: 0, to: 100 },
            { from: 104, to: 104 },
        ])
    ).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 0,
            "to": 102,
          },
          Object {
            "from": 104,
            "to": 104,
          },
        ]
    `);

    expect(compactRanges([parseBlockRange('10-100'), parseBlockRange('50-120'), parseBlockRange('90-100')]))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 10,
            "to": 120,
          },
        ]
    `);
});

test('parseBlockRange', () => {
    expect(parseBlockRange('1-1')).toMatchInlineSnapshot(`
        Object {
          "from": 1,
          "to": 1,
        }
    `);

    expect(() => parseBlockRange('')).toThrowErrorMatchingInlineSnapshot(`"Invalid block range: "`);
    expect(() => parseBlockRange('-')).toThrowErrorMatchingInlineSnapshot(`"Invalid block range: -"`);
    expect(() => parseBlockRange('1-b')).toThrowErrorMatchingInlineSnapshot(`"Invalid block range: 1-b"`);
});

test('chunkedBlockRanges', () => {
    expect(chunkedBlockRanges({ from: 1, to: 30 }, 10)).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 1,
            "to": 10,
          },
          Object {
            "from": 11,
            "to": 20,
          },
          Object {
            "from": 21,
            "to": 30,
          },
        ]
    `);
    expect(chunkedBlockRanges({ from: 1, to: 12 }, 10)).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 1,
            "to": 12,
          },
        ]
    `);
    expect(chunkedBlockRanges({ from: 1, to: 9 }, 10)).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 1,
            "to": 9,
          },
        ]
    `);
    expect(chunkedBlockRanges({ from: 57, to: 72 }, 10)).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 57,
            "to": 66,
          },
          Object {
            "from": 67,
            "to": 72,
          },
        ]
    `);
    expect(chunkedBlockRanges({ from: 0, to: 127000 }, 25, 10)).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 0,
            "to": 24,
          },
          Object {
            "from": 25,
            "to": 49,
          },
          Object {
            "from": 50,
            "to": 74,
          },
          Object {
            "from": 75,
            "to": 99,
          },
          Object {
            "from": 100,
            "to": 124,
          },
          Object {
            "from": 125,
            "to": 149,
          },
          Object {
            "from": 150,
            "to": 174,
          },
          Object {
            "from": 175,
            "to": 199,
          },
          Object {
            "from": 200,
            "to": 224,
          },
          Object {
            "from": 225,
            "to": 249,
          },
        ]
    `);
});

test('blockRangeSize', () => {
    expect(blockRangeSize({ from: 1, to: 1 })).toBe(1);
    expect(blockRangeSize({ from: 1, to: 2 })).toBe(2);
    expect(blockRangeSize({ from: 1, to: 100 })).toBe(100);
});

test('getInverseBlockRanges', () => {
    expect(getInverseBlockRanges([], null, null)).toEqual([]);
    expect(getInverseBlockRanges([], 0, null)).toEqual([]);
    expect(getInverseBlockRanges([], null, 17)).toEqual([]);
    expect(getInverseBlockRanges([], 0, 17)).toEqual([{ from: 0, to: 17 }]);
    expect(getInverseBlockRanges([], 17, 2)).toMatchInlineSnapshot(`Array []`);
});
