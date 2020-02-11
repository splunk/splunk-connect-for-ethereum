# ABI Decoding

Splunk Connect for Ethereum features decoding of function calls and event logs in Ethereum transactions based on [Solidity ABI](https://solidity.readthedocs.io/en/develop/abi-spec.html) information.

In addition to the binary data of transactions, the following information is extracted:

-   Function or event name
-   Parameter values and data types
-   Parameter names
-   Contract name

This information can be used to easily search for semantic aspects of smart contracts and it enables powerful and efficient aggregations and analytics.

## Supplying ABI definitions

You can supply ABI definition files to ethlogger by specifying a directory in which ethlogger should search for them. This can be done by specifying the `--abi-dir` [CLI flag](./cli.md), or by providing the corresponding [environment variable](./cli.md#environment-variables) `ABI_DIR`. For more fine-grained control, you can configure the [ABI repository in ethlogger configuration file](./configuration.md#abirepository).

Each ABI file corresponds to a smart contract and contains all function and event signatures, and optionally a contract name and address at which the contract is deployed.

Matching ABI defintions to transactions follows the following priority order:

-   Contract address (if contract address from ABI file matches address from transaction)
-   Contract fingerprint (contract fingerprint matches fingerprint derived from contract code)
-   Anonymous signature

### File formats

Files in the ABI directory are expected to contain [ABI JSON](https://solidity.readthedocs.io/en/develop/abi-spec.html#abi-json), either as plain list of ABI items, or truffle build files.

#### List of ABI items

ABI files may contain an array of ABI items. In this case the contract name is derived from the file name (by removing the file extension) and no contract address is associated.

**Example**:

```json
[
    {
        "type": "function",
        "name": "transfer",
        "inputs": [
            {
                "name": "recipient",
                "type": "address"
            },
            {
                "name": "amount",
                "type": "uint256"
            }
        ]
    },
    {
        "type": "event",
        "name": "TransferApproved",
        "inputs": [
            {
                "name": "recipient",
                "type": "address"
            },
            {
                "name": "amount",
                "type": "uint256"
            }
        ]
    }
]
```

#### Truffle build files

Truffle build files can have information about which network and contract address a contract has been deployed to. This information is used by ethlogger to fast-track matching an address it encounters on the blockchain to the ABI definition. Furthermore truffle build files can specify a contract name - if not present, the file name will be used as contract name. Files are expected to have a property `abi` containing an array of ABI items, all other information is optional.

```jsonc
{
    "contractName": "My Contract",
    "abi": [
        /* ... ABI items */
    ],
    "networks": {
        "1": {
            "address": "0x123..."
        }
    }
}
```

## Contract Fingerprinting

One challenge that can occur when decoding ABI information is overlapping signatures. Imagine 2 smart contracts both exposing a function with the signature `transfer(address,uint256)`. For one contract the second argument may refer to an amount of currency being transferred (eg. `transfer(to address, amount uint256)`) and for another contract the second argument refers to the ID of a non-fungible item (eg. `transfer(to address, tokenId uint256)`). Given the nature of ABI encoding, both functions end up having the same signature and it's ambiguous for the ABI decoder which one to choose, unless the smart contract can be associated with the ABI definition (if the ABI definiton contains the contract address).

It would be nice, to be able to decode any instance of a smart contract, like an ERC20 and not having to enumerate all the address the contract has been deployed to.

An attempt to solve this problem is "contract fingerprinting". A fingerprint is a hash of all function and event signatures from a contract ABI. We can also derive the fingerprint from the EVM bytecode by extracting all signature hashes, finding matching signatures for them, and computing the fingerprint from it, and then comparing that against the fingerprint computed from the ABI defintion. There is still the possibility of invalid matches, especially for contracts that only have very few functions/events, but with multiple functions the chances are much lower.

Fingerprinting is enabled by default and can be disabled in the [ethlogger configuration](./configuration.md#abirepository).

## Anonymous ABI decoding

For cases where we can find a match with beweteen a deployed contract and a supplied ABI definition, but do have a match for the function or event signature hash, we can emit the reduced amount of information we can derive from the signature alone (the function/evnet name, the parameter data types and values, but not the parameter names or the contract name).

If anonymous ABI encoding is enabled (which it is by default), then this reduced amount of informataion is emitted. In addition to the ABIs supplied by the user, ethlogger ships with a standard set of function and event signatures that are compliled from from external sources:

-   https://github.com/MrLuit/evm
-   https://4byte.directory

Compiled lists can be found here:

-   Function signatures: [function_signatures.txt](../data/function_signatures.txt)
-   Event signatures: [event_signatures.txt](../data/event_signatures.txt)

Those anonymous signature are loaded by default.
