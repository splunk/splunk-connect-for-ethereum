import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { formatGethMemStats, formatGethMetrics } from '../../src/platforms/geth';

test('formatGethMetrics', () => {
    expect(
        formatGethMetrics(
            JSON.parse(readFileSync(join(__dirname, '../fixtures/geth_metrics_response.json'), { encoding: 'utf-8' }))
        )
    ).toMatchSnapshot();
});

test('formatGethMemStats', () => {
    expect(
        formatGethMemStats(
            JSON.parse(readFileSync(join(__dirname, '../fixtures/geth_memstats_response.json'), { encoding: 'utf-8' }))
        )
    ).toMatchSnapshot();
});
