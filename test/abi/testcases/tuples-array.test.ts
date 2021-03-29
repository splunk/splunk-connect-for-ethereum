import { decodeLogEvent } from '../../../src/abi/decode';
import { AbiItemDefinition } from '../../../src/abi/item';

const abi: AbiItemDefinition = {
    inputs: [
        {
            components: [
                {
                    name: 'eventCategory',
                    type: 'string',
                },
                {
                    name: 'orderid',
                    type: 'string',
                },
                {
                    name: 'itemsCount',
                    type: 'uint256',
                },
                {
                    name: 'purchaseCategories',
                    type: 'string[]',
                },
                {
                    name: 'purchaseDate',
                    type: 'uint256',
                },
                {
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
                            name: 'itemPrice',
                            type: 'uint256',
                        },
                        {
                            name: 'itemQuantity',
                            type: 'uint256',
                        },
                    ],
                    name: 'itemDetails',
                    type: 'tuple[]',
                },
            ],
            indexed: false,
            name: 'orderDetails',
            type: 'tuple',
        },
    ],
    name: 'OrderCreated',
    type: 'event',
};

const event = {
    data: `0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000001751a1b540000000000000000000000000000000000000000000000000000000000000009c400000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000000000000000000000000008507572636861736500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084f52443130313032000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000b456c656374726f6e696373000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b536d61727470686f6e65730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002ee0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000f4170706c65206950686f6e652031320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000134170706c65206950686f6e652031322050726f00000000000000000000000000`,
    topics: ['0xe3c8d6ae67e425a240c1676f670c845644f34065cc940fa021481f636b6ad7d8'],
};

test('tuples array struct decoding', async () => {
    expect(decodeLogEvent(event.data, event.topics, abi, '...nosig', false, true)).toMatchInlineSnapshot(`
        Object {
          "args": Object {
            "orderDetails": Object {
              "eventCategory": "Purchase",
              "itemDetails": Array [
                Object {
                  "itemName": "Apple iPhone 12",
                  "itemPrice": 750,
                  "itemQuantity": 2,
                },
                Object {
                  "itemName": "Apple iPhone 12 Pro",
                  "itemPrice": 1000,
                  "itemQuantity": 1,
                },
              ],
              "itemsCount": 3,
              "orderid": "ORD10102",
              "purchaseCategories": Array [
                "Electronics",
                "Smartphones",
              ],
              "purchaseDate": 1602460800000,
              "totalPrice": 2500,
            },
          },
          "name": "OrderCreated",
          "params": Array [
            Object {
              "name": "orderDetails",
              "type": "tuple",
              "value": Object {
                "eventCategory": "Purchase",
                "itemDetails": Array [
                  Object {
                    "itemName": "Apple iPhone 12",
                    "itemPrice": 750,
                    "itemQuantity": 2,
                  },
                  Object {
                    "itemName": "Apple iPhone 12 Pro",
                    "itemPrice": 1000,
                    "itemQuantity": 1,
                  },
                ],
                "itemsCount": 3,
                "orderid": "ORD10102",
                "purchaseCategories": Array [
                  "Electronics",
                  "Smartphones",
                ],
                "purchaseDate": 1602460800000,
                "totalPrice": 2500,
              },
            },
          ],
          "signature": "...nosig",
        }
    `);
});
