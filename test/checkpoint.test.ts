import { Checkpoint } from '../src/checkpoint';

test('Checkpoint', () => {
    const empty = new Checkpoint({ path: '.foo' });
    expect(empty.isEmpty()).toBe(true);

    const checkpoints = new Checkpoint({ path: '.foo', initialBlockNumber: 0 });
    expect(checkpoints.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 1,
          \\"init\\": 0,
          \\"ranges\\": []
        }"
    `);

    checkpoints.markComplete({ from: 10, to: 20 });
    expect(checkpoints.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 1,
          \\"init\\": 0,
          \\"ranges\\": [
            \\"10-20\\"
          ]
        }"
    `);

    checkpoints.markComplete({ from: 30, to: 40 });
    expect(checkpoints.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 1,
          \\"init\\": 0,
          \\"ranges\\": [
            \\"10-20\\",
            \\"30-40\\"
          ]
        }"
    `);

    expect(checkpoints.getIncompleteRanges(50)).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 0,
            "to": 9,
          },
          Object {
            "from": 21,
            "to": 29,
          },
          Object {
            "from": 41,
            "to": 50,
          },
        ]
    `);

    const restored = new Checkpoint({ path: '.foo' });
    restored.initializeFromCheckpointContents(`
      {
        "v": 1,
        "init": 0,
        "ranges": [
          "10-20",
          "30-40"
        ]
      }`);
    expect(restored.initialBlockNumber).toMatchInlineSnapshot(`0`);
    expect(restored.getIncompleteRanges(50)).toMatchInlineSnapshot(`
        Array [
          Object {
            "from": 0,
            "to": 9,
          },
          Object {
            "from": 21,
            "to": 29,
          },
          Object {
            "from": 41,
            "to": 50,
          },
        ]
    `);
});
