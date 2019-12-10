import { readFileSync } from 'fs-extra';
import { join } from 'path';
import {
    durationStringToMs,
    formatGethMemStats,
    formatGethMetrics,
    parseAbbreviatedNumber,
} from '../../src/platforms/geth';

// import { EthereumClient } from '../../src/eth/client';
// import { HttpTransport } from '../../src/eth/http';
// import { gethTxpool } from '../../src/eth/requests';
// import { NodeMetricsMessage } from '../../src/msgs';
// test.only('temp', async () => {
//     const ethClient = new EthereumClient(
//         new HttpTransport({
//             url: 'http://localhost:22000',
//         })
//     );

//     // console.log(JSON.stringify(await ethClient.request(gethTxpool())));

//     const msgs = await captureGethMetrics(ethClient, Date.now());

//     const metrics: any = {};

//     for (const msg of msgs) {
//         if (msg.type === 'node:metrics') {
//             for (const { name, value } of msg.metrics) {
//                 metrics[`metric_name:eth.foo123.${name}`] = value;
//             }
//         }
//     }

//     console.log(JSON.stringify(metrics, null, 2));
//     console.log(JSON.stringify(metrics).length);

//     // console.log(JSON.stringify(await ethClient.request(gethMemStats())));
// });

test('parseAbbreviatedNumber', () => {
    expect(parseAbbreviatedNumber('123')).toBe(123);
    expect(parseAbbreviatedNumber('-123')).toBe(-123);
    expect(parseAbbreviatedNumber('1.23K')).toBe(1230);
    expect(parseAbbreviatedNumber('4.59M')).toBe(4_590_000);
    expect(parseAbbreviatedNumber('-26516807')).toBe(-26516807);
    expect(parseAbbreviatedNumber('2.37G')).toBe(2_370_000_000);
});

test('durationStringToMs', () => {
    expect(durationStringToMs('1ms')).toBe(1);
    expect(durationStringToMs('1s')).toBe(1000);
    expect(durationStringToMs('-1s')).toBe(-1000);
    expect(durationStringToMs('0.5ms')).toBe(0.5);
    expect(durationStringToMs('2562047h47m16.854775807s')).toMatchInlineSnapshot(`922365136854.7758`);
    expect(durationStringToMs('-2562047h47m16.854775807s')).toMatchInlineSnapshot(`-922365136854.7758`);
    expect(durationStringToMs('.5us')).toMatchInlineSnapshot(`0.0005`);
    expect(durationStringToMs('1s5ns')).toMatchInlineSnapshot(`1000.000005`);
    expect(durationStringToMs('s')).toBe(NaN);
    expect(durationStringToMs('123f')).toBe(NaN);
    expect(durationStringToMs('0x123')).toBe(NaN);
});

test('formatGethMetrics', () => {
    expect(
        formatGethMetrics(
            JSON.parse(readFileSync(join(__dirname, '../fixtures/geth_metrics_response.json'), { encoding: 'utf-8' }))
        )
    ).toMatchInlineSnapshot(`
        Array [
          Object {
            "name": "geth.metrics.chain.inserts.avg01Min",
            "value": 51,
          },
          Object {
            "name": "geth.metrics.chain.inserts.avg05Min",
            "value": 177,
          },
          Object {
            "name": "geth.metrics.chain.inserts.avg15Min",
            "value": 249,
          },
          Object {
            "name": "geth.metrics.chain.inserts.maximum",
            "value": 31.790945,
          },
          Object {
            "name": "geth.metrics.chain.inserts.minimum",
            "value": 0.533687,
          },
          Object {
            "name": "geth.metrics.chain.inserts.overall",
            "value": 302,
          },
          Object {
            "name": "geth.metrics.chain.inserts.percentiles.5",
            "value": 1.622736,
          },
          Object {
            "name": "geth.metrics.chain.inserts.percentiles.20",
            "value": 1.886774,
          },
          Object {
            "name": "geth.metrics.chain.inserts.percentiles.50",
            "value": 2.147799,
          },
          Object {
            "name": "geth.metrics.chain.inserts.percentiles.80",
            "value": 4.579833,
          },
          Object {
            "name": "geth.metrics.chain.inserts.percentiles.95",
            "value": 10.52114,
          },
          Object {
            "name": "geth.metrics.db.preimage.hits.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.db.preimage.total.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.inboundTraffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.inboundTraffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.inboundTraffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.inboundTraffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.outboundTraffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.outboundTraffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.outboundTraffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.discv5.outboundTraffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.input.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.input.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.input.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.input.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.output.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.output.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.output.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.output.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.time.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.time.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.time.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.time.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.counter.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.counter.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.counter.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.counter.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.duration.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.duration.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.duration.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.compact.writedelay.duration.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.read.avg01Min",
            "value": 149,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.read.avg05Min",
            "value": 84580,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.read.avg15Min",
            "value": 558480,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.read.overall",
            "value": 4600,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.write.avg01Min",
            "value": 236220,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.write.avg05Min",
            "value": 867930,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.write.avg15Min",
            "value": 1450000,
          },
          Object {
            "name": "geth.metrics.eth.db.chaindata.disk.write.overall",
            "value": 1390000,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.drop.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.drop.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.drop.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.drop.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.in.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.in.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.in.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.in.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.maximum",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.minimum",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.percentiles.5",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.percentiles.20",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.percentiles.50",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.percentiles.80",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.req.percentiles.95",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.timeout.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.timeout.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.timeout.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.bodies.timeout.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.drop.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.drop.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.drop.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.drop.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.in.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.in.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.in.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.in.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.maximum",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.minimum",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.percentiles.5",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.percentiles.20",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.percentiles.50",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.percentiles.80",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.req.percentiles.95",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.timeout.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.timeout.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.timeout.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.headers.timeout.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.drop.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.drop.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.drop.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.drop.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.in.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.in.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.in.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.in.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.maximum",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.minimum",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.percentiles.5",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.percentiles.20",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.percentiles.50",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.percentiles.80",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.req.percentiles.95",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.timeout.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.timeout.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.timeout.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.receipts.timeout.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.drop.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.drop.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.drop.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.drop.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.in.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.in.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.in.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.downloader.states.in.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.bodies.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.bodies.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.bodies.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.bodies.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.headers.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.headers.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.headers.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.fetch.headers.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.in.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.in.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.in.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.in.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.out.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.out.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.out.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.bodies.out.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.in.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.in.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.in.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.in.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.out.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.out.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.out.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.filter.headers.out.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.dos.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.dos.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.dos.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.dos.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.drop.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.drop.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.drop.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.drop.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.in.avg01Min",
            "value": 20,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.in.avg05Min",
            "value": 69,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.in.avg15Min",
            "value": 97,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.in.overall",
            "value": 117,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.avg01Min",
            "value": 51,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.avg05Min",
            "value": 177,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.avg15Min",
            "value": 249,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.maximum",
            "value": 922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.minimum",
            "value": 3.004626,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.overall",
            "value": 302,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.percentiles.5",
            "value": 3.588335,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.percentiles.20",
            "value": 5.805709,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.percentiles.50",
            "value": -922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.percentiles.80",
            "value": -922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.announces.out.percentiles.95",
            "value": -922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.dos.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.dos.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.dos.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.dos.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.drop.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.drop.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.drop.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.drop.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.in.avg01Min",
            "value": 256,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.in.avg05Min",
            "value": 868,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.in.avg15Min",
            "value": 1220,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.in.overall",
            "value": 1470,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.avg01Min",
            "value": 51,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.avg05Min",
            "value": 177,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.avg15Min",
            "value": 249,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.maximum",
            "value": 922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.minimum",
            "value": 1.345938,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.overall",
            "value": 302,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.percentiles.5",
            "value": 1.619732,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.percentiles.20",
            "value": 1.956826,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.percentiles.50",
            "value": -922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.percentiles.80",
            "value": -922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.fetcher.prop.broadcasts.out.percentiles.95",
            "value": -922365136854.7758,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.packets.avg01Min",
            "value": 3440,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.packets.avg05Min",
            "value": 12110,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.packets.avg15Min",
            "value": 17700,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.packets.overall",
            "value": 20420,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.traffic.avg01Min",
            "value": 910760,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.traffic.avg05Min",
            "value": 3180000,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.traffic.avg15Min",
            "value": 4520000,
          },
          Object {
            "name": "geth.metrics.eth.misc.in.traffic.overall",
            "value": 5390000,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.packets.avg01Min",
            "value": 3510,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.packets.avg05Min",
            "value": 12180,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.packets.avg15Min",
            "value": 17660,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.packets.overall",
            "value": 20520,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.traffic.avg01Min",
            "value": 931920,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.traffic.avg05Min",
            "value": 3240000,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.traffic.avg15Min",
            "value": 4590000,
          },
          Object {
            "name": "geth.metrics.eth.misc.out.traffic.overall",
            "value": 5490000,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.packets.avg01Min",
            "value": 216,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.packets.avg05Min",
            "value": 737,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.packets.avg15Min",
            "value": 1030,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.packets.overall",
            "value": 1250,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.traffic.avg01Min",
            "value": 356670,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.traffic.avg05Min",
            "value": 1230000,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.traffic.avg15Min",
            "value": 1720000,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.in.traffic.overall",
            "value": 2069999.9999999998,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.packets.avg01Min",
            "value": 210,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.packets.avg05Min",
            "value": 723,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.packets.avg15Min",
            "value": 1010,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.packets.overall",
            "value": 1230,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.traffic.avg01Min",
            "value": 353370,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.traffic.avg05Min",
            "value": 1210000,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.traffic.avg15Min",
            "value": 1690000,
          },
          Object {
            "name": "geth.metrics.eth.prop.blocks.out.traffic.overall",
            "value": 2040000,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.packets.avg01Min",
            "value": 35,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.packets.avg05Min",
            "value": 126,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.packets.avg15Min",
            "value": 178,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.packets.overall",
            "value": 216,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.traffic.avg01Min",
            "value": 1330,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.traffic.avg05Min",
            "value": 4680,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.traffic.avg15Min",
            "value": 6590,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.in.traffic.overall",
            "value": 7970,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.packets.avg01Min",
            "value": 37,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.packets.avg05Min",
            "value": 139,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.packets.avg15Min",
            "value": 196,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.packets.overall",
            "value": 239,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.traffic.avg01Min",
            "value": 1390,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.traffic.avg05Min",
            "value": 5150,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.traffic.avg15Min",
            "value": 7270,
          },
          Object {
            "name": "geth.metrics.eth.prop.hashes.out.traffic.overall",
            "value": 8820,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.packets.avg01Min",
            "value": 956,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.packets.avg05Min",
            "value": 3460,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.packets.avg15Min",
            "value": 4880,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.packets.overall",
            "value": 5900,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.traffic.avg01Min",
            "value": 154760,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.traffic.avg05Min",
            "value": 558510,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.traffic.avg15Min",
            "value": 786940,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.in.traffic.overall",
            "value": 950970,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.packets.avg01Min",
            "value": 935,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.packets.avg05Min",
            "value": 3360,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.packets.avg15Min",
            "value": 4700,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.packets.overall",
            "value": 5650,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.traffic.avg01Min",
            "value": 151280,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.traffic.avg05Min",
            "value": 543430,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.traffic.avg15Min",
            "value": 759210,
          },
          Object {
            "name": "geth.metrics.eth.prop.txns.out.traffic.overall",
            "value": 912780,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.in.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.bodies.out.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.in.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.headers.out.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.in.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.receipts.out.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.in.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.eth.req.states.out.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.in.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.packets.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.packets.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.packets.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.packets.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.traffic.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.traffic.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.traffic.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.les.misc.out.traffic.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.p2p.inboundConnects.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.p2p.inboundConnects.avg05Min",
            "value": 37,
          },
          Object {
            "name": "geth.metrics.p2p.inboundConnects.avg15Min",
            "value": 243,
          },
          Object {
            "name": "geth.metrics.p2p.inboundConnects.overall",
            "value": 2,
          },
          Object {
            "name": "geth.metrics.p2p.inboundTraffic.avg01Min",
            "value": 1500000,
          },
          Object {
            "name": "geth.metrics.p2p.inboundTraffic.avg05Min",
            "value": 5330000,
          },
          Object {
            "name": "geth.metrics.p2p.inboundTraffic.avg15Min",
            "value": 7920000,
          },
          Object {
            "name": "geth.metrics.p2p.inboundTraffic.overall",
            "value": 8910000,
          },
          Object {
            "name": "geth.metrics.p2p.outboundConnects.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.p2p.outboundConnects.avg05Min",
            "value": 74,
          },
          Object {
            "name": "geth.metrics.p2p.outboundConnects.avg15Min",
            "value": 485,
          },
          Object {
            "name": "geth.metrics.p2p.outboundConnects.overall",
            "value": 4,
          },
          Object {
            "name": "geth.metrics.p2p.outboundTraffic.avg01Min",
            "value": 1520000,
          },
          Object {
            "name": "geth.metrics.p2p.outboundTraffic.avg05Min",
            "value": 5350000,
          },
          Object {
            "name": "geth.metrics.p2p.outboundTraffic.avg15Min",
            "value": 7940000,
          },
          Object {
            "name": "geth.metrics.p2p.outboundTraffic.overall",
            "value": 8930000,
          },
          Object {
            "name": "geth.metrics.system.disk.readbytes.overall",
            "value": 10313500,
          },
          Object {
            "name": "geth.metrics.system.disk.readcount.avg01Min",
            "value": 22100,
          },
          Object {
            "name": "geth.metrics.system.disk.readcount.avg05Min",
            "value": 79390,
          },
          Object {
            "name": "geth.metrics.system.disk.readcount.avg15Min",
            "value": 120670,
          },
          Object {
            "name": "geth.metrics.system.disk.readcount.overall",
            "value": 132360,
          },
          Object {
            "name": "geth.metrics.system.disk.readdata.avg01Min",
            "value": 1730000,
          },
          Object {
            "name": "geth.metrics.system.disk.readdata.avg05Min",
            "value": 6360000,
          },
          Object {
            "name": "geth.metrics.system.disk.readdata.avg15Min",
            "value": 10460000,
          },
          Object {
            "name": "geth.metrics.system.disk.readdata.overall",
            "value": 10310000,
          },
          Object {
            "name": "geth.metrics.system.disk.writebytes.overall",
            "value": 29244562,
          },
          Object {
            "name": "geth.metrics.system.disk.writecount.avg01Min",
            "value": 31030,
          },
          Object {
            "name": "geth.metrics.system.disk.writecount.avg05Min",
            "value": 113120,
          },
          Object {
            "name": "geth.metrics.system.disk.writecount.avg15Min",
            "value": 184720,
          },
          Object {
            "name": "geth.metrics.system.disk.writecount.overall",
            "value": 183470,
          },
          Object {
            "name": "geth.metrics.system.disk.writedata.avg01Min",
            "value": 4960000,
          },
          Object {
            "name": "geth.metrics.system.disk.writedata.avg05Min",
            "value": 18240000,
          },
          Object {
            "name": "geth.metrics.system.disk.writedata.avg15Min",
            "value": 30720000,
          },
          Object {
            "name": "geth.metrics.system.disk.writedata.overall",
            "value": 29240000,
          },
          Object {
            "name": "geth.metrics.system.memory.allocs.avg01Min",
            "value": 1870000,
          },
          Object {
            "name": "geth.metrics.system.memory.allocs.avg05Min",
            "value": 7270000,
          },
          Object {
            "name": "geth.metrics.system.memory.allocs.avg15Min",
            "value": 14110000,
          },
          Object {
            "name": "geth.metrics.system.memory.allocs.overall",
            "value": 11100000,
          },
          Object {
            "name": "geth.metrics.system.memory.frees.avg01Min",
            "value": 2250000,
          },
          Object {
            "name": "geth.metrics.system.memory.frees.avg05Min",
            "value": 6920000,
          },
          Object {
            "name": "geth.metrics.system.memory.frees.avg15Min",
            "value": 11010000,
          },
          Object {
            "name": "geth.metrics.system.memory.frees.overall",
            "value": 10520000,
          },
          Object {
            "name": "geth.metrics.system.memory.inuse.avg01Min",
            "value": -26516807,
          },
          Object {
            "name": "geth.metrics.system.memory.inuse.avg05Min",
            "value": 8700000000,
          },
          Object {
            "name": "geth.metrics.system.memory.inuse.avg15Min",
            "value": 57930000000,
          },
          Object {
            "name": "geth.metrics.system.memory.inuse.overall",
            "value": 266310000,
          },
          Object {
            "name": "geth.metrics.system.memory.pauses.avg01Min",
            "value": 3100000,
          },
          Object {
            "name": "geth.metrics.system.memory.pauses.avg05Min",
            "value": 367430000,
          },
          Object {
            "name": "geth.metrics.system.memory.pauses.avg15Min",
            "value": 2370000000,
          },
          Object {
            "name": "geth.metrics.system.memory.pauses.overall",
            "value": 46460000,
          },
          Object {
            "name": "geth.metrics.trie.cachemiss.overall",
            "value": 1786,
          },
          Object {
            "name": "geth.metrics.trie.cacheunload.overall",
            "value": 27,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.nodes.avg01Min",
            "value": 11,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.nodes.avg05Min",
            "value": 38,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.nodes.avg15Min",
            "value": 53,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.nodes.overall",
            "value": 64,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.size.avg01Min",
            "value": 2380,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.size.avg05Min",
            "value": 7920,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.size.avg15Min",
            "value": 10730,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.size.overall",
            "value": 12670,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.time.mean",
            "value": 0.00202,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.time.measurements",
            "value": 1,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.time.percentiles.5",
            "value": 0.00202,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.time.percentiles.20",
            "value": 0.00202,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.time.percentiles.50",
            "value": 0.00202,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.time.percentiles.80",
            "value": 0.00202,
          },
          Object {
            "name": "geth.metrics.trie.memcache.commit.time.percentiles.95",
            "value": 0.00202,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.nodes.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.nodes.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.nodes.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.nodes.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.size.avg01Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.size.avg05Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.size.avg15Min",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.size.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.time.mean",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.time.measurements",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.time.percentiles.5",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.time.percentiles.20",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.time.percentiles.50",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.time.percentiles.80",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.flush.time.percentiles.95",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.nodes.avg01Min",
            "value": 51,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.nodes.avg05Min",
            "value": 123,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.nodes.avg15Min",
            "value": 151,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.nodes.overall",
            "value": 171,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.size.avg01Min",
            "value": 11080,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.size.avg05Min",
            "value": 25840,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.size.avg15Min",
            "value": 31400,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.size.overall",
            "value": 35550,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.time.mean",
            "value": 0.010393000000000001,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.time.measurements",
            "value": 1,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.time.percentiles.5",
            "value": 0.010393000000000001,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.time.percentiles.20",
            "value": 0.010393000000000001,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.time.percentiles.50",
            "value": 0.010393000000000001,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.time.percentiles.80",
            "value": 0.010393000000000001,
          },
          Object {
            "name": "geth.metrics.trie.memcache.gc.time.percentiles.95",
            "value": 0.010393000000000001,
          },
          Object {
            "name": "geth.metrics.txpool.invalid.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.pending.discard.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.pending.nofunds.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.pending.ratelimit.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.pending.replace.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.queued.discard.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.queued.nofunds.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.queued.ratelimit.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.queued.replace.overall",
            "value": 0,
          },
          Object {
            "name": "geth.metrics.txpool.underpriced.overall",
            "value": 0,
          },
        ]
    `);
});

test('formatGethMemStats', () => {
    expect(
        formatGethMemStats(
            JSON.parse(readFileSync(join(__dirname, '../fixtures/geth_memstats_response.json'), { encoding: 'utf-8' }))
        )
    ).toMatchInlineSnapshot(`
        Array [
          Object {
            "name": "geth.memStats.alloc",
            "value": 352699992,
          },
          Object {
            "name": "geth.memStats.totalAlloc",
            "value": 1457755368,
          },
          Object {
            "name": "geth.memStats.sys",
            "value": 772692216,
          },
          Object {
            "name": "geth.memStats.lookups",
            "value": 0,
          },
          Object {
            "name": "geth.memStats.mallocs",
            "value": 7976493,
          },
          Object {
            "name": "geth.memStats.frees",
            "value": 6588376,
          },
          Object {
            "name": "geth.memStats.heapAlloc",
            "value": 352699992,
          },
          Object {
            "name": "geth.memStats.heapSys",
            "value": 735019008,
          },
          Object {
            "name": "geth.memStats.heapIdle",
            "value": 370565120,
          },
          Object {
            "name": "geth.memStats.heapInuse",
            "value": 364453888,
          },
          Object {
            "name": "geth.memStats.heapReleased",
            "value": 0,
          },
          Object {
            "name": "geth.memStats.heapObjects",
            "value": 1388117,
          },
          Object {
            "name": "geth.memStats.stackInuse",
            "value": 3178496,
          },
          Object {
            "name": "geth.memStats.stackSys",
            "value": 3178496,
          },
          Object {
            "name": "geth.memStats.mSpanInuse",
            "value": 2797256,
          },
          Object {
            "name": "geth.memStats.mSpanSys",
            "value": 3555328,
          },
          Object {
            "name": "geth.memStats.mCacheInuse",
            "value": 27648,
          },
          Object {
            "name": "geth.memStats.mCacheSys",
            "value": 32768,
          },
          Object {
            "name": "geth.memStats.buckHashSys",
            "value": 1655776,
          },
          Object {
            "name": "geth.memStats.gCSys",
            "value": 26128384,
          },
          Object {
            "name": "geth.memStats.otherSys",
            "value": 3122456,
          },
          Object {
            "name": "geth.memStats.nextGC",
            "value": 430387856,
          },
          Object {
            "name": "geth.memStats.lastGC",
            "value": 1575932287019647000,
          },
          Object {
            "name": "geth.memStats.pauseTotalNs",
            "value": 42908706,
          },
          Object {
            "name": "geth.memStats.numGC",
            "value": 9,
          },
          Object {
            "name": "geth.memStats.numForcedGC",
            "value": 0,
          },
          Object {
            "name": "geth.memStats.gCCPUFraction",
            "value": 0.00022859077571677725,
          },
          Object {
            "name": "geth.memStats.bySize.0.mallocs",
            "value": 0,
          },
          Object {
            "name": "geth.memStats.bySize.0.frees",
            "value": 0,
          },
          Object {
            "name": "geth.memStats.bySize.8.mallocs",
            "value": 58453,
          },
          Object {
            "name": "geth.memStats.bySize.8.frees",
            "value": 46954,
          },
          Object {
            "name": "geth.memStats.bySize.16.mallocs",
            "value": 1318409,
          },
          Object {
            "name": "geth.memStats.bySize.16.frees",
            "value": 1082759,
          },
          Object {
            "name": "geth.memStats.bySize.32.mallocs",
            "value": 2798547,
          },
          Object {
            "name": "geth.memStats.bySize.32.frees",
            "value": 2253347,
          },
          Object {
            "name": "geth.memStats.bySize.48.mallocs",
            "value": 962142,
          },
          Object {
            "name": "geth.memStats.bySize.48.frees",
            "value": 771407,
          },
          Object {
            "name": "geth.memStats.bySize.64.mallocs",
            "value": 331176,
          },
          Object {
            "name": "geth.memStats.bySize.64.frees",
            "value": 270202,
          },
          Object {
            "name": "geth.memStats.bySize.80.mallocs",
            "value": 360907,
          },
          Object {
            "name": "geth.memStats.bySize.80.frees",
            "value": 295321,
          },
          Object {
            "name": "geth.memStats.bySize.96.mallocs",
            "value": 150148,
          },
          Object {
            "name": "geth.memStats.bySize.96.frees",
            "value": 122187,
          },
          Object {
            "name": "geth.memStats.bySize.112.mallocs",
            "value": 106377,
          },
          Object {
            "name": "geth.memStats.bySize.112.frees",
            "value": 86799,
          },
          Object {
            "name": "geth.memStats.bySize.128.mallocs",
            "value": 204260,
          },
          Object {
            "name": "geth.memStats.bySize.128.frees",
            "value": 166718,
          },
          Object {
            "name": "geth.memStats.bySize.144.mallocs",
            "value": 105150,
          },
          Object {
            "name": "geth.memStats.bySize.144.frees",
            "value": 85611,
          },
          Object {
            "name": "geth.memStats.bySize.160.mallocs",
            "value": 44768,
          },
          Object {
            "name": "geth.memStats.bySize.160.frees",
            "value": 36456,
          },
          Object {
            "name": "geth.memStats.bySize.176.mallocs",
            "value": 10971,
          },
          Object {
            "name": "geth.memStats.bySize.176.frees",
            "value": 9179,
          },
          Object {
            "name": "geth.memStats.bySize.192.mallocs",
            "value": 33315,
          },
          Object {
            "name": "geth.memStats.bySize.192.frees",
            "value": 27187,
          },
          Object {
            "name": "geth.memStats.bySize.208.mallocs",
            "value": 67116,
          },
          Object {
            "name": "geth.memStats.bySize.208.frees",
            "value": 54771,
          },
          Object {
            "name": "geth.memStats.bySize.224.mallocs",
            "value": 16434,
          },
          Object {
            "name": "geth.memStats.bySize.224.frees",
            "value": 13653,
          },
          Object {
            "name": "geth.memStats.bySize.240.mallocs",
            "value": 10166,
          },
          Object {
            "name": "geth.memStats.bySize.240.frees",
            "value": 8259,
          },
          Object {
            "name": "geth.memStats.bySize.256.mallocs",
            "value": 5996,
          },
          Object {
            "name": "geth.memStats.bySize.256.frees",
            "value": 4873,
          },
          Object {
            "name": "geth.memStats.bySize.288.mallocs",
            "value": 68481,
          },
          Object {
            "name": "geth.memStats.bySize.288.frees",
            "value": 56305,
          },
          Object {
            "name": "geth.memStats.bySize.320.mallocs",
            "value": 29188,
          },
          Object {
            "name": "geth.memStats.bySize.320.frees",
            "value": 23838,
          },
          Object {
            "name": "geth.memStats.bySize.352.mallocs",
            "value": 15317,
          },
          Object {
            "name": "geth.memStats.bySize.352.frees",
            "value": 12758,
          },
          Object {
            "name": "geth.memStats.bySize.384.mallocs",
            "value": 8905,
          },
          Object {
            "name": "geth.memStats.bySize.384.frees",
            "value": 6371,
          },
          Object {
            "name": "geth.memStats.bySize.416.mallocs",
            "value": 508,
          },
          Object {
            "name": "geth.memStats.bySize.416.frees",
            "value": 383,
          },
          Object {
            "name": "geth.memStats.bySize.448.mallocs",
            "value": 464221,
          },
          Object {
            "name": "geth.memStats.bySize.448.frees",
            "value": 379440,
          },
          Object {
            "name": "geth.memStats.bySize.480.mallocs",
            "value": 1576,
          },
          Object {
            "name": "geth.memStats.bySize.480.frees",
            "value": 1336,
          },
          Object {
            "name": "geth.memStats.bySize.512.mallocs",
            "value": 61050,
          },
          Object {
            "name": "geth.memStats.bySize.512.frees",
            "value": 50069,
          },
          Object {
            "name": "geth.memStats.bySize.576.mallocs",
            "value": 32534,
          },
          Object {
            "name": "geth.memStats.bySize.576.frees",
            "value": 26060,
          },
          Object {
            "name": "geth.memStats.bySize.640.mallocs",
            "value": 17763,
          },
          Object {
            "name": "geth.memStats.bySize.640.frees",
            "value": 13972,
          },
          Object {
            "name": "geth.memStats.bySize.704.mallocs",
            "value": 1119,
          },
          Object {
            "name": "geth.memStats.bySize.704.frees",
            "value": 947,
          },
          Object {
            "name": "geth.memStats.bySize.768.mallocs",
            "value": 384,
          },
          Object {
            "name": "geth.memStats.bySize.768.frees",
            "value": 353,
          },
          Object {
            "name": "geth.memStats.bySize.896.mallocs",
            "value": 4482,
          },
          Object {
            "name": "geth.memStats.bySize.896.frees",
            "value": 3666,
          },
          Object {
            "name": "geth.memStats.bySize.1024.mallocs",
            "value": 1648,
          },
          Object {
            "name": "geth.memStats.bySize.1024.frees",
            "value": 1386,
          },
          Object {
            "name": "geth.memStats.bySize.1152.mallocs",
            "value": 3088,
          },
          Object {
            "name": "geth.memStats.bySize.1152.frees",
            "value": 2578,
          },
          Object {
            "name": "geth.memStats.bySize.1280.mallocs",
            "value": 1064,
          },
          Object {
            "name": "geth.memStats.bySize.1280.frees",
            "value": 897,
          },
          Object {
            "name": "geth.memStats.bySize.1408.mallocs",
            "value": 1112,
          },
          Object {
            "name": "geth.memStats.bySize.1408.frees",
            "value": 981,
          },
          Object {
            "name": "geth.memStats.bySize.1536.mallocs",
            "value": 30023,
          },
          Object {
            "name": "geth.memStats.bySize.1536.frees",
            "value": 24384,
          },
          Object {
            "name": "geth.memStats.bySize.1792.mallocs",
            "value": 850,
          },
          Object {
            "name": "geth.memStats.bySize.1792.frees",
            "value": 328,
          },
          Object {
            "name": "geth.memStats.bySize.2048.mallocs",
            "value": 553,
          },
          Object {
            "name": "geth.memStats.bySize.2048.frees",
            "value": 440,
          },
          Object {
            "name": "geth.memStats.bySize.2304.mallocs",
            "value": 427,
          },
          Object {
            "name": "geth.memStats.bySize.2304.frees",
            "value": 343,
          },
          Object {
            "name": "geth.memStats.bySize.2688.mallocs",
            "value": 1366,
          },
          Object {
            "name": "geth.memStats.bySize.2688.frees",
            "value": 1196,
          },
          Object {
            "name": "geth.memStats.bySize.3072.mallocs",
            "value": 393,
          },
          Object {
            "name": "geth.memStats.bySize.3072.frees",
            "value": 276,
          },
          Object {
            "name": "geth.memStats.bySize.3200.mallocs",
            "value": 124,
          },
          Object {
            "name": "geth.memStats.bySize.3200.frees",
            "value": 83,
          },
          Object {
            "name": "geth.memStats.bySize.3456.mallocs",
            "value": 380,
          },
          Object {
            "name": "geth.memStats.bySize.3456.frees",
            "value": 327,
          },
          Object {
            "name": "geth.memStats.bySize.4096.mallocs",
            "value": 3228,
          },
          Object {
            "name": "geth.memStats.bySize.4096.frees",
            "value": 2703,
          },
          Object {
            "name": "geth.memStats.bySize.4864.mallocs",
            "value": 687,
          },
          Object {
            "name": "geth.memStats.bySize.4864.frees",
            "value": 577,
          },
          Object {
            "name": "geth.memStats.bySize.5376.mallocs",
            "value": 121,
          },
          Object {
            "name": "geth.memStats.bySize.5376.frees",
            "value": 88,
          },
          Object {
            "name": "geth.memStats.bySize.6144.mallocs",
            "value": 346,
          },
          Object {
            "name": "geth.memStats.bySize.6144.frees",
            "value": 286,
          },
          Object {
            "name": "geth.memStats.bySize.6528.mallocs",
            "value": 50,
          },
          Object {
            "name": "geth.memStats.bySize.6528.frees",
            "value": 37,
          },
          Object {
            "name": "geth.memStats.bySize.6784.mallocs",
            "value": 23,
          },
          Object {
            "name": "geth.memStats.bySize.6784.frees",
            "value": 22,
          },
          Object {
            "name": "geth.memStats.bySize.6912.mallocs",
            "value": 13,
          },
          Object {
            "name": "geth.memStats.bySize.6912.frees",
            "value": 10,
          },
          Object {
            "name": "geth.memStats.bySize.8192.mallocs",
            "value": 551,
          },
          Object {
            "name": "geth.memStats.bySize.8192.frees",
            "value": 456,
          },
          Object {
            "name": "geth.memStats.bySize.9472.mallocs",
            "value": 320,
          },
          Object {
            "name": "geth.memStats.bySize.9472.frees",
            "value": 249,
          },
          Object {
            "name": "geth.memStats.bySize.9728.mallocs",
            "value": 22,
          },
          Object {
            "name": "geth.memStats.bySize.9728.frees",
            "value": 17,
          },
          Object {
            "name": "geth.memStats.bySize.10240.mallocs",
            "value": 25,
          },
          Object {
            "name": "geth.memStats.bySize.10240.frees",
            "value": 17,
          },
          Object {
            "name": "geth.memStats.bySize.10880.mallocs",
            "value": 1740,
          },
          Object {
            "name": "geth.memStats.bySize.10880.frees",
            "value": 1467,
          },
          Object {
            "name": "geth.memStats.bySize.12288.mallocs",
            "value": 32,
          },
          Object {
            "name": "geth.memStats.bySize.12288.frees",
            "value": 21,
          },
          Object {
            "name": "geth.memStats.bySize.13568.mallocs",
            "value": 293,
          },
          Object {
            "name": "geth.memStats.bySize.13568.frees",
            "value": 242,
          },
          Object {
            "name": "geth.memStats.bySize.14336.mallocs",
            "value": 33,
          },
          Object {
            "name": "geth.memStats.bySize.14336.frees",
            "value": 18,
          },
          Object {
            "name": "geth.memStats.bySize.16384.mallocs",
            "value": 45,
          },
          Object {
            "name": "geth.memStats.bySize.16384.frees",
            "value": 38,
          },
          Object {
            "name": "geth.memStats.bySize.18432.mallocs",
            "value": 24,
          },
          Object {
            "name": "geth.memStats.bySize.18432.frees",
            "value": 17,
          },
          Object {
            "name": "geth.memStats.bySize.19072.mallocs",
            "value": 1716,
          },
          Object {
            "name": "geth.memStats.bySize.19072.frees",
            "value": 1446,
          },
        ]
    `);
});
