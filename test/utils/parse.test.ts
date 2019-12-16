import { durationStringToMs, parseAbbreviatedNumber } from '../../src/utils/parse';

test('parseAbbreviatedNumber', () => {
    expect(parseAbbreviatedNumber('123')).toBe(123);
    expect(parseAbbreviatedNumber('-123')).toBe(-123);
    expect(parseAbbreviatedNumber('1.23K')).toBe(1230);
    expect(parseAbbreviatedNumber('4.59M')).toBe(4_590_000);
    expect(parseAbbreviatedNumber('-26516807')).toBe(-26516807);
    expect(parseAbbreviatedNumber('2.37G')).toBe(2_370_000_000);
});

test('durationStringToMs', () => {
    expect(durationStringToMs('1ms')).toBe(1);
    expect(durationStringToMs('1s')).toBe(1000);
    expect(durationStringToMs('-1s')).toBe(-1000);
    expect(durationStringToMs('0.5ms')).toBe(0.5);
    expect(durationStringToMs('2562047h47m16.854775807s')).toMatchInlineSnapshot(`922365136854.7758`);
    expect(durationStringToMs('-2562047h47m16.854775807s')).toMatchInlineSnapshot(`-922365136854.7758`);
    expect(durationStringToMs('.5us')).toMatchInlineSnapshot(`0.0005`);
    expect(durationStringToMs('1s5ns')).toMatchInlineSnapshot(`1000.000005`);
    expect(durationStringToMs('s')).toBe(NaN);
    expect(durationStringToMs('123f')).toBe(NaN);
    expect(durationStringToMs('0x123')).toBe(NaN);
});
