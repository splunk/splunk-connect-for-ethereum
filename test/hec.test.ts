import { serializeTime, serializeEvent, serializeMetric, parseHecConfig } from '../src/hec';

test('serializeTime', () => {
    expect(serializeTime(new Date('2019-11-29T12:15:27.123Z'))).toMatchInlineSnapshot(`1575029727.123`);
    expect(serializeTime(1575029727123)).toMatchInlineSnapshot(`1575029727.123`);
});

test('serializeEvent', () => {
    expect(
        serializeEvent({
            body: 'hello world',
            time: new Date('2019-11-29T12:15:27.123Z'),
            metadata: {
                host: 'myhost',
                source: 'somesource',
                sourcetype: 'somesourcetype',
                index: 'myindex',
            },
        }).toString('utf8')
    ).toMatchInlineSnapshot(
        `"{\\"time\\":1575029727.123,\\"event\\":\\"hello world\\",\\"host\\":\\"myhost\\",\\"source\\":\\"somesource\\",\\"sourcetype\\":\\"somesourcetype\\",\\"index\\":\\"myindex\\"}"`
    );
});

test('serializeMetric', () => {
    expect(
        serializeMetric({
            time: new Date('2019-11-29T12:15:27.123Z'),
            name: 'mymetric',
            value: 47.11,
            metadata: {
                host: 'myhost',
                source: 'somesource',
                sourcetype: 'somesourcetype',
                index: 'myindex',
            },
        }).toString('utf8')
    ).toMatchInlineSnapshot(
        `"{\\"time\\":1575029727.123,\\"fields\\":{\\"metric_name\\":\\"mymetric\\",\\"_value\\":47.11},\\"host\\":\\"myhost\\",\\"source\\":\\"somesource\\",\\"sourcetype\\":\\"somesourcetype\\",\\"index\\":\\"myindex\\"}"`
    );
});

test('parseHecConfig', () => {
    expect(
        parseHecConfig({
            url: 'https://localhost:8088',
            token: '11111111111111',
            validateCertificate: false,
        })
    ).toMatchInlineSnapshot(`
        Object {
          "defaultMetadata": Object {},
          "flushTime": 0,
          "gzip": true,
          "maxQueueEntries": -1,
          "maxQueueSize": 512000,
          "maxRetries": Infinity,
          "maxSockets": 256,
          "requestKeepAlive": true,
          "retryWaitTime": [Function],
          "timeout": 30000,
          "token": "11111111111111",
          "url": "https://localhost:8088/services/collector/event/1.0",
          "userAgent": "ethlogger-hec-client/1.0",
          "validateCertificate": false,
        }
    `);
});
