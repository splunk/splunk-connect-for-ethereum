import { reconcileStructFromDecodedTuple } from '../../src/abi/decode';

describe('reconcileStructFromDecodedTuple', () => {
    it('reconciles struct from tuple', () => {
        expect(
            reconcileStructFromDecodedTuple(['foo', 'bar', 123], {
                name: 'foo',
                type: 'tuple',
                components: [
                    {
                        name: 'a',
                        type: 'string',
                    },
                    {
                        name: 'b',
                        type: 'string',
                    },
                    {
                        name: 'c',
                        type: 'uint256',
                    },
                ],
            })
        ).toMatchInlineSnapshot(`
            Object {
              "a": "foo",
              "b": "bar",
              "c": 123,
            }
        `);
    });

    it('reconciles array of struct from tuple array', () => {
        expect(
            reconcileStructFromDecodedTuple(
                [
                    ['foo', 'bar', 123],
                    ['baz', 'bing', 456],
                ],
                {
                    name: 'foo',
                    type: 'tuple[]',
                    components: [
                        {
                            name: 'a',
                            type: 'string',
                        },
                        {
                            name: 'b',
                            type: 'string',
                        },
                        {
                            name: 'c',
                            type: 'uint256',
                        },
                    ],
                }
            )
        ).toMatchInlineSnapshot(`
            Array [
              Object {
                "a": "foo",
                "b": "bar",
                "c": 123,
              },
              Object {
                "a": "baz",
                "b": "bing",
                "c": 456,
              },
            ]
        `);
    });
});
