jest.useFakeTimers();

const createMockPromise = <T>(n: () => T, timeout: number) => ({
    then(cb: (n: T) => void) {
        setTimeout(() => cb(n()), timeout);
    },
});

// const createFailingMockPromise = <E extends Error>(n: () => E, timeout: number) => ({
//     then(_, cb) {
//         setTimeout(() => cb(n()), timeout);
//     },
// });

test('parallel', async () => {
    // eslint-disable-next-line
    const { parallel } = require('../../src/utils/async');
    let started = 0;
    let completed = 0;
    const tasks = [...Array(10)].map((_, i) => () => {
        started++;
        return createMockPromise(() => {
            completed++;
            return i;
        }, 10) as Promise<number>;
    });
    const allComplete = parallel(tasks, { maxConcurrent: 2 });

    jest.runTimersToTime(1);

    expect(started).toBe(2);
    expect(completed).toBe(0);

    jest.runTimersToTime(11);

    expect(started).toBe(4);
    expect(completed).toBe(2);

    jest.runTimersToTime(101);

    expect(started).toBe(10);
    expect(completed).toBe(10);

    const r = await allComplete;
    expect(r).toMatchInlineSnapshot(`
        Array [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
        ]
    `);
});
