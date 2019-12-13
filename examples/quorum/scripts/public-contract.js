a = eth.accounts[0];
web3.eth.defaultAccount = a;

// abi and bytecode generated from simplestorage.sol:
// > solcjs --bin --abi simplestorage.sol
var abi = [
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'initVal',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'data',
                type: 'uint256',
            },
        ],
        name: 'StorageEvent',
        type: 'event',
    },
    {
        constant: true,
        inputs: [],
        name: 'get',
        outputs: [
            {
                internalType: 'uint256',
                name: 'retVal',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256',
                name: 'x',
                type: 'uint256',
            },
        ],
        name: 'set',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'storedData',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
];

var bytecode =
    '0x608060405234801561001057600080fd5b506040516101843803806101848339818101604052602081101561003357600080fd5b810190808051906020019092919050505080600081905550506101298061005b6000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c80632a1afcd914604157806360fe47b114605d5780636d4ce63c146088575b600080fd5b604760a4565b6040518082815260200191505060405180910390f35b608660048036036020811015607157600080fd5b810190808035906020019092919050505060aa565b005b608e60eb565b6040518082815260200191505060405180910390f35b60005481565b806000819055507f859ae9a3f700c6d0d2862bae857266f81c853a1b2c33868ad14b08f8854161cf816040518082815260200191505060405180910390a150565b6000805490509056fea265627a7a723158201ba645a0c66536ac5441d0a5c0e55bfe5d96fd9c05b390de423e908e48ea598764736f6c634300050c0032';

var simpleContract = web3.eth.contract(abi);
var simple = simpleContract.new(42, { from: web3.eth.accounts[0], data: bytecode, gas: 0x47b760 }, function(
    e,
    contract
) {
    if (e) {
        console.log('err creating contract', e);
    } else {
        if (!contract.address) {
            console.log(
                'Contract transaction send: TransactionHash: ' + contract.transactionHash + ' waiting to be mined...'
            );
        } else {
            console.log('Contract mined! Address: ' + contract.address);
            console.log(contract);
        }
    }
});

admin.sleepBlocks(3);
