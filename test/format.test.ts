import { formatBlock, formatHexToFloatingPoint, formatTransaction } from '../src/format';

test('formatBlock', () => {
    expect(
        formatBlock({
            difficulty: '0x0',
            extraData: '0x0',
            gasLimit: '0x0',
            gasUsed: '0x0',
            hash: '0x0',
            logsBloom: '0x0',
            miner: '0x0000000000000000000000000000000000000000',
            nonce: '0x0',
            number: '0x1',
            parentHash: '0x0',
            receiptsRoot: '0x0',
            sha3Uncles: '0x0',
            size: '0x0',
            stateRoot: '0x0',
            timestamp: '0x5b541449',
            totalDifficulty: '0x1',
            transactions: ['0x0'],
            transactionsRoot: '0x0',
            uncles: [],
        })
    ).toMatchInlineSnapshot(`
        Object {
          "difficulty": 0,
          "extraData": "0x0",
          "gasLimit": 0,
          "gasUsed": 0,
          "hash": "0x0",
          "logsBloom": "0x0",
          "miner": "0x0000000000000000000000000000000000000000",
          "nonce": "0x0",
          "number": 1,
          "parentHash": "0x0",
          "receiptsRoot": "0x0",
          "sha3Uncles": "0x0",
          "size": 0,
          "stateRoot": "0x0",
          "timestamp": 1532236873,
          "totalDifficulty": 1,
          "transactionCount": 1,
          "transactionsRoot": "0x0",
          "uncles": Array [],
        }
    `);
});

test('formatTransaction', () => {
    expect(
        formatTransaction(
            {
                blockHash: '0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35',
                blockNumber: '0x5bad55',
                from: '0x398137383b3d25c92898c656696e41950e47316b',
                gas: '0x1d45e',
                gasPrice: '0xfa56ea00',
                hash: '0xbb3a336e3f823ec18197f1e13ee875700f08f03e2cab75f0d0b118dabb44cba0',
                input:
                    '0xf7d8c88300000000000000000000000000000000000000000000000000000000000cee6100000000000000000000000000000000000000000000000000000000000ac3e1',
                nonce: '0x18',
                r: '0x2a378831cf81d99a3f06a18ae1b6ca366817ab4d88a70053c41d7a8f0368e031',
                s: '0x450d831a05b6e418724436c05c155e0a1b7b921015d0fbc2f667aed709ac4fb5',
                to: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                transactionIndex: '0x11',
                v: '0x25',
                value: '0x1c6bf526340000',
            },
            {
                blockHash: '0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35',
                blockNumber: '0x5bad55',
                contractAddress: undefined,
                cumulativeGasUsed: '0xb90b0',
                from: '0x398137383b3d25c92898c656696e41950e47316b',
                gasUsed: '0x1383f',
                logs: [],
                status: '0x1',
                to: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
                transactionHash: '0xbb3a336e3f823ec18197f1e13ee875700f08f03e2cab75f0d0b118dabb44cba0',
                transactionIndex: '0x11',
            }
        )
    ).toMatchInlineSnapshot(`
        Object {
          "blockHash": "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
          "blockNumber": 6008149,
          "call": undefined,
          "contractAddress": null,
          "contractAddressInfo": undefined,
          "cumulativeGasUsed": 757936,
          "from": "0x398137383B3D25C92898C656696e41950e47316B",
          "fromInfo": undefined,
          "gas": 119902,
          "gasPrice": 4200000000,
          "gasUsed": 79935,
          "hash": "0xbb3a336e3f823ec18197f1e13ee875700f08f03e2cab75f0d0b118dabb44cba0",
          "input": "0xf7d8c88300000000000000000000000000000000000000000000000000000000000cee6100000000000000000000000000000000000000000000000000000000000ac3e1",
          "nonce": 24,
          "privatePayload": undefined,
          "r": "0x2a378831cf81d99a3f06a18ae1b6ca366817ab4d88a70053c41d7a8f0368e031",
          "s": "0x450d831a05b6e418724436c05c155e0a1b7b921015d0fbc2f667aed709ac4fb5",
          "status": "success",
          "to": "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
          "toInfo": undefined,
          "transactionIndex": 17,
          "v": "0x25",
          "value": 8000000000000000,
        }
    `);
});

test('formatHexToFloatingPoint', () => {
    expect(formatHexToFloatingPoint('', 13)).toMatchInlineSnapshot(`"0.0000000000000"`);
    expect(formatHexToFloatingPoint('0x', 13)).toMatchInlineSnapshot(`"0.0000000000000"`);
    expect(formatHexToFloatingPoint('0x00', 13)).toMatchInlineSnapshot(`"0.0000000000000"`);
    expect(formatHexToFloatingPoint('0x01', 13)).toMatchInlineSnapshot(`"0.0000000000001"`);
    expect(formatHexToFloatingPoint('0xaf', 0)).toMatchInlineSnapshot(`"175"`);
    expect(formatHexToFloatingPoint('0xaf', 1)).toMatchInlineSnapshot(`"17.5"`);
    expect(formatHexToFloatingPoint('0xaf', 2)).toMatchInlineSnapshot(`"1.75"`);
    expect(formatHexToFloatingPoint('0xdeadbeef', 8)).toMatchInlineSnapshot(`"37.35928559"`);
});
