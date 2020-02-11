import { parseParameterValue } from '../../src/abi/decode';

test('parseParameterValue', () => {
    expect(parseParameterValue('123', 'uint256')).toBe(123);
    expect(parseParameterValue('6581651658165165165156132198465165168', 'uint256')).toBe(
        '6581651658165165165156132198465165168'
    );
});
