import { subsituteVariablesInValues } from '../../src/utils/vars';

test('subsituteVariables', () => {
    const vars = {
        HOSTNAME: 'lando.foobar.com',
        PID: '123123',
    };

    expect(
        subsituteVariablesInValues(
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
