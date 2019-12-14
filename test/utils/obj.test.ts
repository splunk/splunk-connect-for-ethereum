import { deepMerge, removeEmtpyValues, prefixKeys, subsituteVariables } from '../../src/utils/obj';

test('deepMerge', () => {
    expect(deepMerge({ a: 'foo' }, { a: 'bar' })).toMatchInlineSnapshot(`
        Object {
          "a": "bar",
        }
    `);
    expect(deepMerge({ a: 'foo' }, { b: 'bar' })).toMatchInlineSnapshot(`
        Object {
          "a": "foo",
          "b": "bar",
        }
    `);
    expect(deepMerge({ a: { b: { first: 1, second: 2, third: 3 } } }, { a: { b: { second: 4 } } }))
        .toMatchInlineSnapshot(`
        Object {
          "a": Object {
            "b": Object {
              "first": 1,
              "second": 4,
              "third": 3,
            },
          },
        }
    `);
    expect(deepMerge({ a: { b: { first: 1, second: 2, third: 3 } } }, { a: { b: { second: 4, fourth: 2 } } }))
        .toMatchInlineSnapshot(`
        Object {
          "a": Object {
            "b": Object {
              "first": 1,
              "fourth": 2,
              "second": 4,
              "third": 3,
            },
          },
        }
    `);
});

test('removeEmtpyValues', () => {
    expect({ a: undefined, foo: null, yo: 'yo' }).toMatchInlineSnapshot(`
        Object {
          "a": undefined,
          "foo": null,
          "yo": "yo",
        }
    `);
    expect(removeEmtpyValues({ a: undefined, foo: null, yo: 'yo' })).toMatchInlineSnapshot(`
        Object {
          "yo": "yo",
        }
    `);
});

test('prefixKeys', () => {
    expect(
        prefixKeys(
            {
                some: 123,
                foo: 47.11,
                bar: 8.15,
            },
            'some.metric.'
        )
    ).toMatchInlineSnapshot(`
        Object {
          "some.metric.bar": 8.15,
          "some.metric.foo": 47.11,
          "some.metric.some": 123,
        }
    `);
});

test('subsituteVariables', () => {
    const vars = {
        HOSTNAME: 'lando.foobar.com',
        PID: '123123',
    };

    expect(
        subsituteVariables(
            {
                test1: 'foobar',
                test2: '$HOSTNAME',
                test3: 'yo $PID, how are you? and how about $HOSTNAME?',
            },
            vars
        )
    ).toMatchInlineSnapshot(`
        Object {
          "test1": "foobar",
          "test2": "lando.foobar.com",
          "test3": "yo 123123, how are you? and how about lando.foobar.com?",
        }
    `);
});
