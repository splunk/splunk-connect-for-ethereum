import { decodeLogEvent } from '../../../src/abi/decode';
import { AbiItemDefinition } from '../../../src/abi/item';

const abi: AbiItemDefinition = {
    inputs: [
        {
            indexed: false,
            name: 'eventCategory',
            type: 'string',
        },
        {
            indexed: false,
            name: 'orderid',
            type: 'string',
        },
        {
            indexed: false,
            name: 'itemsCount',
            type: 'uint256',
        },
        {
            indexed: false,
            name: 'purchaseCategory',
            type: 'string',
        },
        {
            indexed: false,
            name: 'purchaseDate',
            type: 'uint256',
        },
        {
            indexed: false,
            name: 'totalPrice',
            type: 'uint256',
        },
        {
            components: [
                {
                    name: 'itemName',
                    type: 'string',
                },
                {
                    name: 'itemQuantity',
                    type: 'uint256',
                },
                {
                    name: 'itemPrice',
                    type: 'uint256',
                },
            ],
            indexed: false,
            name: 'itemDetails',
            type: 'tuple',
        },
    ],
    name: 'CreateOrderEvent',
    type: 'event',
};

const event = {
    data: `0x00000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000001751a1b540000000000000000000000000000000000000000000000000000000000000005dc00000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000008507572636861736500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084f52443130313032000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b456c656374726f6e6963730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000002ee000000000000000000000000000000000000000000000000000000000000000f4170706c65206950686f6e652031310000000000000000000000000000000000`,
    topics: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
};

test('tuples decoding', async () => {
    expect(decodeLogEvent(event.data, event.topics, abi, '...nosig', false)).toMatchInlineSnapshot(`
        Object {
          "args": Object {
            "eventCategory": "Purchase",
            "itemDetails": Array [
              "Apple iPhone 11",
              2,
              750,
            ],
            "itemsCount": 2,
            "orderid": "ORD10102",
            "purchaseCategory": "Electronics",
            "purchaseDate": 1602460800000,
            "totalPrice": 1500,
          },
          "name": "CreateOrderEvent",
          "params": Array [
            Object {
              "name": "eventCategory",
              "type": "string",
              "value": "Purchase",
            },
            Object {
              "name": "orderid",
              "type": "string",
              "value": "ORD10102",
            },
            Object {
              "name": "itemsCount",
              "type": "uint256",
              "value": 2,
            },
            Object {
              "name": "purchaseCategory",
              "type": "string",
              "value": "Electronics",
            },
            Object {
              "name": "purchaseDate",
              "type": "uint256",
              "value": 1602460800000,
            },
            Object {
              "name": "totalPrice",
              "type": "uint256",
              "value": 1500,
            },
            Object {
              "name": "itemDetails",
              "type": "tuple",
              "value": Array [
                "Apple iPhone 11",
                2,
                750,
              ],
            },
          ],
          "signature": "...nosig",
        }
    `);
});

test('tuples struct decoding', async () => {
    expect(decodeLogEvent(event.data, event.topics, abi, '...nosig', false, true)).toMatchInlineSnapshot(`
        Object {
          "args": Object {
            "eventCategory": "Purchase",
            "itemDetails": Object {
              "itemName": "Apple iPhone 11",
              "itemPrice": 750,
              "itemQuantity": 2,
            },
            "itemsCount": 2,
            "orderid": "ORD10102",
            "purchaseCategory": "Electronics",
            "purchaseDate": 1602460800000,
            "totalPrice": 1500,
          },
          "name": "CreateOrderEvent",
          "params": Array [
            Object {
              "name": "eventCategory",
              "type": "string",
              "value": "Purchase",
            },
            Object {
              "name": "orderid",
              "type": "string",
              "value": "ORD10102",
            },
            Object {
              "name": "itemsCount",
              "type": "uint256",
              "value": 2,
            },
            Object {
              "name": "purchaseCategory",
              "type": "string",
              "value": "Electronics",
            },
            Object {
              "name": "purchaseDate",
              "type": "uint256",
              "value": 1602460800000,
            },
            Object {
              "name": "totalPrice",
              "type": "uint256",
              "value": 1500,
            },
            Object {
              "name": "itemDetails",
              "type": "tuple",
              "value": Object {
                "itemName": "Apple iPhone 11",
                "itemPrice": 750,
                "itemQuantity": 2,
              },
            },
          ],
          "signature": "...nosig",
        }
    `);
});
