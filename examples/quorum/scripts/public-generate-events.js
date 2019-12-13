// From console test node 1 & 7 to see if the events were recorded
// seth is a cool CLI (but you can use whatever you'd like): https://github.com/dapphub/dapptools
//   $> seth events 0x1932c48b2bf8102ba33b4a6b545c32236e342f34 | wc -l

// NOTE: replace this with the address of the contract you wish to generate
//       events for.
var address = '0xa30398c3e91070d2f1d0d2694356574a15ab245d';

// simple contract
var abi = [
    {
        constant: true,
        inputs: [],
        name: 'storedData',
        outputs: [{ name: '', type: 'uint256' }],
        payable: false,
        type: 'function',
    },
    {
        constant: false,
        inputs: [{ name: 'x', type: 'uint256' }],
        name: 'set',
        outputs: [],
        payable: false,
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'get',
        outputs: [{ name: 'retVal', type: 'uint256' }],
        payable: false,
        type: 'function',
    },
    { inputs: [{ name: 'initVal', type: 'uint256' }], payable: false, type: 'constructor' },
];
var contract = eth.contract(abi).at(address);

for (i = 0; i < 20; i++) {
    contract.set(4, { from: eth.accounts[0] });
}
