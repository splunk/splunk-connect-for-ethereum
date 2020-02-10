import { subsituteVariablesInValues, subsituteVariables } from '../../src/utils/vars';

test('subsituteVariables', () => {
    expect(
        subsituteVariables('ethlogger/$VERSION', {
            VERSION: '1.2.1',
        })
    ).toMatchInlineSnapshot(`"ethlogger/1.2.1"`);

    expect(subsituteVariables('foobar', {})).toBe('foobar');
});

test('subsituteVariablesInValues', () => {
    const vars = {
        HOSTNAME: 'lando.foobar.com',
        PID: '123123',
        ENODE: '',
    };

    expect(
        subsituteVariablesInValues(
            {
                test1: 'foobar',
                test2: '$HOSTNAME',
                test3: 'yo $PID, how are you? and how about $HOSTNAME?',
                test4: '$ENODE',
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
