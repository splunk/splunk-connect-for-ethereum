import { AbortManager } from '../../src/utils/abort';
import { parallel, sleep } from '../../src/utils/async';

test('parallel', async () => {
    const start = Date.now();
    const started: { [k: string]: boolean } = {};
    const completed: { [k: string]: boolean } = {};

    const makeTask = (i: number, t: number, onstart: () => void) => async () => {
        onstart();
        started[i] = true;
        await sleep(t);
        completed[i] = true;
        return i;
    };

    const tasks = [
        makeTask(1, 10, () => {
            expect({ started, completed }).toMatchInlineSnapshot(`
                Object {
                  "completed": Object {},
                  "started": Object {},
                }
            `);
        }),
        makeTask(2, 15, () => {
            expect({ started, completed }).toMatchInlineSnapshot(`
                Object {
                  "completed": Object {},
                  "started": Object {
                    "1": true,
                  },
                }
            `);
        }),
        makeTask(3, 100, () => {
            expect(Date.now() - start).toBeGreaterThanOrEqual(10);
            expect({ started, completed }).toMatchInlineSnapshot(`
                Object {
                  "completed": Object {
                    "1": true,
                  },
                  "started": Object {
                    "1": true,
                    "2": true,
                  },
                }
            `);
        }),
        makeTask(4, 10, () => {
            expect(Date.now() - start).toBeGreaterThanOrEqual(15);
            expect({ started, completed }).toMatchInlineSnapshot(`
                Object {
                  "completed": Object {
                    "1": true,
                    "2": true,
                  },
                  "started": Object {
                    "1": true,
                    "2": true,
                    "3": true,
                  },
                }
            `);
        }),
        makeTask(5, 10, () => {
            expect(Date.now() - start).toBeGreaterThanOrEqual(25);
            expect({ started, completed }).toMatchInlineSnapshot(`
                Object {
                  "completed": Object {
                    "1": true,
                    "2": true,
                    "4": true,
                  },
                  "started": Object {
                    "1": true,
                    "2": true,
                    "3": true,
                    "4": true,
                  },
                }
            `);
        }),
        makeTask(6, 10, () => {
            expect(Date.now() - start).toBeGreaterThanOrEqual(35);
            expect({ started, completed }).toMatchInlineSnapshot(`
                Object {
                  "completed": Object {
                    "1": true,
                    "2": true,
                    "4": true,
                    "5": true,
                  },
                  "started": Object {
                    "1": true,
                    "2": true,
                    "3": true,
                    "4": true,
                    "5": true,
                  },
                }
            `);
        }),
    ];

    const result = await parallel(tasks, { maxConcurrent: 2 });
    expect(result.length).toBe(tasks.length);

    expect(result).toMatchInlineSnapshot(`
        Array [
          1,
          2,
          3,
          4,
          5,
          6,
        ]
    `);
    expect({ started, completed }).toMatchInlineSnapshot(`
        Object {
          "completed": Object {
            "1": true,
            "2": true,
            "3": true,
            "4": true,
            "5": true,
            "6": true,
          },
          "started": Object {
            "1": true,
            "2": true,
            "3": true,
            "4": true,
            "5": true,
            "6": true,
          },
        }
    `);
});

test('parallel abort', async () => {
    const abortManager = new AbortManager();
    const spy = jest.fn();
    const tasks = [
        () =>
            sleep(10)
                .then(() => 1)
                .then(spy),
        () =>
            sleep(15)
                .then(() => 2)
                .then(spy),
        () =>
            sleep(20)
                .then(() => 3)
                .then(spy),
        () => {
            abortManager.abort();
            return Promise.resolve(4).then(spy);
        },
        () =>
            sleep(10)
                .then(() => 5)
                .then(spy),
        () =>
            sleep(10)
                .then(() => 6)
                .then(spy),
    ];

    await expect(parallel(tasks, { maxConcurrent: 2, abortManager })).rejects.toMatchInlineSnapshot(
        `Symbol([[ABORT]])`
    );

    expect(spy.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            1,
          ],
          Array [
            2,
          ],
          Array [
            4,
          ],
        ]
    `);
});
