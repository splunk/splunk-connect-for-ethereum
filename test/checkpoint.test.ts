import { State } from '../src/state';

test('Checkpoint', () => {
    const empty = new State({ path: '.foo' });
    const checkpoint = empty.getCheckpoint('main');
    expect(checkpoint.isEmpty()).toBe(true);

    const state = new State({ path: '.foo' });
    expect(state.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 2
        }"
    `);
    state.getCheckpoint('main').setInitialBlockNumber(0);

    state.getCheckpoint('main').markComplete({ from: 10, to: 20 });
    expect(state.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 2,
          \\"main\\": {
            \\"init\\": 0,
            \\"ranges\\": [
              \\"10-20\\"
            ]
          }
        }"
    `);

    state.getCheckpoint('main').markComplete({ from: 30, to: 40 });
    expect(state.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 2,
          \\"main\\": {
            \\"init\\": 0,
            \\"ranges\\": [
              \\"10-20\\",
              \\"30-40\\"
            ]
          }
        }"
    `);

    expect(state.getCheckpoint('main').getIncompleteRanges(50)).toMatchInlineSnapshot(`
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

    const contractCheckpoint = state.getCheckpoint('0xdeadbeef');
    contractCheckpoint.setInitialBlockNumber(1000);
    contractCheckpoint.markComplete({ from: 1100, to: 1200 });
    expect(state.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 2,
          \\"main\\": {
            \\"init\\": 0,
            \\"ranges\\": [
              \\"10-20\\",
              \\"30-40\\"
            ]
          },
          \\"0xdeadbeef\\": {
            \\"init\\": 1000,
            \\"ranges\\": [
              \\"1100-1200\\"
            ]
          }
        }"
    `);

    const restored = new State({ path: '.foo' });
    restored.initializeFromCheckpointContents(`
      {
        "v": 1,
        "init": 0,
        "ranges": [
          "10-20",
          "30-40"
        ]
      }`);
    expect(restored.getCheckpoint('main').getinitialBlockNumber()).toMatchInlineSnapshot(`0`);
    expect(restored.getCheckpoint('main').getIncompleteRanges(50)).toMatchInlineSnapshot(`
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
    expect(restored.serialize()).toMatchInlineSnapshot(`
        "{
          \\"v\\": 2,
          \\"main\\": {
            \\"init\\": 0,
            \\"ranges\\": [
              \\"10-20\\",
              \\"30-40\\"
            ]
          }
        }"
    `);
});
