import { AggregateMetric } from '../../src/utils/stats';

test('AggregateMetric', () => {
    const m = new AggregateMetric();

    m.push(1);
    m.push(2);
    m.push(2);
    m.push(1);
    m.push(5);
    m.push(18);
    m.push(36);
    m.push(2);
    m.push(1);

    expect(m.flush('foo')).toMatchInlineSnapshot(`
        Object {
          "foo.avg": 7.555555555555555,
          "foo.count": 9,
          "foo.max": 36,
          "foo.min": 1,
          "foo.p99": 5,
          "foo.sum": 68,
        }
    `);
    expect(m.flush('foo')).toMatchInlineSnapshot(`
        Object {
          "foo.count": 0,
        }
    `);

    m.push(1);

    expect(m.flush('some.prefix.foo', { count: true, min: true, avg: true, p80: true, p90: true, p99: true }))
        .toMatchInlineSnapshot(`
        Object {
          "some.prefix.foo.avg": 1,
          "some.prefix.foo.count": 1,
          "some.prefix.foo.min": 1,
          "some.prefix.foo.p80": 1,
          "some.prefix.foo.p90": 1,
          "some.prefix.foo.p99": 1,
        }
    `);
});
