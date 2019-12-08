import { parseBigInt, bigIntToNumber } from '../../src/utils/bn';

test('parseBigInt', () => {
    expect(parseBigInt(0)).toMatchInlineSnapshot(`0`);
    expect(parseBigInt(21321231321)).toMatchInlineSnapshot(`21321231321`);
    expect(parseBigInt('21321231321')).toMatchInlineSnapshot(`21321231321`);
    expect(parseBigInt('0xaaaaaaaaaaaaaaaaaaa21321231321')).toMatchInlineSnapshot(
        `"886151997189943915269195259913114401"`
    );
    expect(parseBigInt('0xabcabcabc')).toMatchInlineSnapshot(`46115048124`);
    expect(parseBigInt('0xabcabcabcabcabc')).toMatchInlineSnapshot(`"773682123238001340"`);
    expect(parseBigInt(-10)).toMatchInlineSnapshot(`-10`);
    expect(parseBigInt(-103829472893748)).toMatchInlineSnapshot(`-103829472893748`);
    expect(parseBigInt('-103829472893748')).toMatchInlineSnapshot(`-103829472893748`);
    expect(() => parseBigInt('hello')).toThrowErrorMatchingInlineSnapshot(`"Cannot convert hello to a BigInt"`);
    expect(() => parseBigInt('')).toThrowErrorMatchingInlineSnapshot(`"Cannot convert empty value to BigInt"`);
});

test('bigIntToNumber', () => {
    expect(bigIntToNumber(0)).toMatchInlineSnapshot(`0`);
    expect(bigIntToNumber(21321231321)).toMatchInlineSnapshot(`21321231321`);
    expect(bigIntToNumber('21321231321')).toMatchInlineSnapshot(`21321231321`);
    expect(bigIntToNumber('0x000001234')).toMatchInlineSnapshot(`4660`);
    expect(() => bigIntToNumber('0xaaaaaaaaaaaaaaaaaaa21321231321')).toThrowErrorMatchingInlineSnapshot(
        `"BigInt overflow for \\"0xaaaaaaaaaaaaaaaaaaa21321231321\\" - cannot convert to number"`
    );
});
