## [3.5.5](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.5.4...v3.5.5) (2022-09-01)


### Bug Fixes

* 🐛 Remove the yarn cache from the Docker image ([3d1caa7](https://github.com/splunk/splunk-connect-for-ethereum/commit/3d1caa78121da3fbe0fd869f01d70b83ccbb1f9a))

## [3.5.4](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.5.3...v3.5.4) (2022-08-29)


### Bug Fixes

* 🐛 Upgrade dependencies of ethlogger ([93c0f94](https://github.com/splunk/splunk-connect-for-ethereum/commit/93c0f94f07b99da336d7440a3fa55e79adb4d529))

## [3.5.3](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.5.2...v3.5.3) (2022-08-22)


### Bug Fixes

* 🐛 Update Alpine base image to 14.20 ([28c996a](https://github.com/splunk/splunk-connect-for-ethereum/commit/28c996a36a4419cdce104306e84562a7d092d57e))

## [3.5.2](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.5.1...v3.5.2) (2022-08-04)


### Bug Fixes

* 🐛 geth adapter should only call supported generic rpcs ([d0fa3b8](https://github.com/splunk/splunk-connect-for-ethereum/commit/d0fa3b80991fd557077aac6f9250077e31e616cb))

## [3.5.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.5.0...v3.5.1) (2022-05-16)


### Bug Fixes

* 🐛 Fix README ([bef90f3](https://github.com/splunk/splunk-connect-for-ethereum/commit/bef90f32fd1c8cbbb6c5ccdcf33a19f2059f5e55))

# [3.5.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.4.1...v3.5.0) (2021-12-15)


### Features

* 🎸 Log Ethereum balance of token transfers and NFTs ([4b018c0](https://github.com/splunk/splunk-connect-for-ethereum/commit/4b018c0848cae19828f8d8b3edd2ec4ebe6003f2))

## [3.4.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.4.0...v3.4.1) (2021-12-14)


### Bug Fixes

* 🐛 NFT watcher: Filter events by contract address ([ce6b339](https://github.com/splunk/splunk-connect-for-ethereum/commit/ce6b339ef2a4ac54f65b3e4f2b6c40b28e8c070b))

# [3.4.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.3.1...v3.4.0) (2021-12-13)


### Bug Fixes

* 🐛 Distinguish token index from splunk index ([81b7179](https://github.com/splunk/splunk-connect-for-ethereum/commit/81b7179a230d2e6c6feb94d414c412c65bb65c0d))


### Features

* 🎸 Add transactionHash to NFT payload ([1741444](https://github.com/splunk/splunk-connect-for-ethereum/commit/1741444687e971e3d922dd4648a4a4379e0f7866))

## [3.3.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.3.0...v3.3.1) (2021-12-02)


### Bug Fixes

* 🐛 Support contracts throwing when asked for tokenURI ([55aa44b](https://github.com/splunk/splunk-connect-for-ethereum/commit/55aa44bf4c05d2a43242e206854f0ce6e3aa18e0))

# [3.3.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.2.0...v3.3.0) (2021-11-24)


### Features

* 🎸 NFT watch ([34e7af9](https://github.com/splunk/splunk-connect-for-ethereum/commit/34e7af9d5a4d0ef56eba81789e324cb87087f97e))

# [3.2.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.1.0...v3.2.0) (2021-11-11)


### Features

* 🎸 Watch ERC-20 token transfers ([2acc77f](https://github.com/splunk/splunk-connect-for-ethereum/commit/2acc77f5007eb1593ba7652c968a6bbc51d467f6))

# [3.1.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.0.1...v3.1.0) (2021-09-14)


### Features

* 🎸 add http/s proxy support for RPC endpoints ([f0436fc](https://github.com/splunk/splunk-connect-for-ethereum/commit/f0436fc0ef7f2e6ef8760c0969ea712cd619c75e))

## [3.0.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v3.0.0...v3.0.1) (2021-04-26)


### Bug Fixes

* 🐛 accept truffle-style ABI files without contractName ([e2f3e28](https://github.com/splunk/splunk-connect-for-ethereum/commit/e2f3e28e1cac024ea09abac523ab891187ff8e7c))

# [3.0.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.4.0...v3.0.0) (2021-03-30)


### Bug Fixes

* 🐛 compatibility with nodes not supporting eth_protocolVersion ([256c4d9](https://github.com/splunk/splunk-connect-for-ethereum/commit/256c4d94c9ce269f63c0eaa7c216613e7accc98d))
* 🐛 Parsing error of certain parameter data types ([504e482](https://github.com/splunk/splunk-connect-for-ethereum/commit/504e482f43f7792ca2f5bfc40b85c3cb382b3456))


### Features

* 🎸 ABI decoding of tuple arrays ([cbf3ecf](https://github.com/splunk/splunk-connect-for-ethereum/commit/cbf3ecfcb9386be157d43571f54aa839bb7dfdba))
* 🎸 enable reconciliation of struct data by default ([90e57e0](https://github.com/splunk/splunk-connect-for-ethereum/commit/90e57e08cc77ae77ae836a3263cd097024cc4b77))


### BREAKING CHANGES

* Output of decoded transactions and events may look
different with the change of the default behavior. Set
`reconcileStructShapeFromTuples` to false in ethlogger.yaml to restore
the behavior of previous versions.

# [2.4.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.3.0...v2.4.0) (2021-03-24)


### Features

* 🎸 Exposing git commit SHA in --version output ([e2ca052](https://github.com/splunk/splunk-connect-for-ethereum/commit/e2ca05262cd27dd5e0fa26f07fb38230df49b4c6))

# [2.3.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.2.1...v2.3.0) (2020-11-24)


### Features

* 🎸 Add besu adapter ([9718835](https://github.com/splunk/splunk-connect-for-ethereum/commit/9718835b284add881092dd1343b659d023fc29c0))

## [2.2.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.2.0...v2.2.1) (2020-11-12)


### Bug Fixes

* 🐛 properly decode tuple values in call/event inputs ([28edb0b](https://github.com/splunk/splunk-connect-for-ethereum/commit/28edb0b5000be33f8f8fec6c30ed53d28960ac0a))

# [2.2.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.1.1...v2.2.0) (2020-08-19)


### Features

* 🎸 Support for Quorum private transaction payload ([a25aad9](https://github.com/splunk/splunk-connect-for-ethereum/commit/a25aad9fac293a7c073d3999a1d8c79d753f2f73))

## [2.1.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.1.0...v2.1.1) (2020-08-07)


### Bug Fixes

* 🐛 stop polling debug_metrics for recent Geth versions ([66180f7](https://github.com/splunk/splunk-connect-for-ethereum/commit/66180f7805c0fca81ebe13115fccd00bb4445d47)), closes [#49](https://github.com/splunk/splunk-connect-for-ethereum/issues/49)

# [2.1.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.7...v2.1.0) (2020-07-08)

### Bug Fixes

-   🐛 avoid bigint overflow when parsing gas related info ([c743bbb](https://github.com/splunk/splunk-connect-for-ethereum/commit/c743bbb4f16a60b4c9305abcac10932d89784e87)), closes [#53](https://github.com/splunk/splunk-connect-for-ethereum/issues/53)

### Features

-   🎸 New config paramter to skip contract match requirement ([29403f4](https://github.com/splunk/splunk-connect-for-ethereum/commit/29403f402ba10b1411dc9297b409d4b648964fc0))
-   🎸 New debug mode to determine contract info ([465efdd](https://github.com/splunk/splunk-connect-for-ethereum/commit/465efdd16c2e1a5991916bd9c6ef23089639b252))

## [2.0.7](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.6...v2.0.7) (2020-05-08)

### Bug Fixes

-   🐛 HEC timeout in docker-compose examples ([6dda3f4](https://github.com/splunk/splunk-connect-for-ethereum/commit/6dda3f4159380acdcc3a9396fe4cea0369b3a49c)), closes [#43](https://github.com/splunk/splunk-connect-for-ethereum/issues/43)

## [2.0.6](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.5...v2.0.6) (2020-04-09)

### Bug Fixes

-   🐛 avoid panic when parsing certain ABI param types ([f4a2d94](https://github.com/splunk/splunk-connect-for-ethereum/commit/f4a2d94e06c0af829153baccff05574a1e255ba1)), closes [#35](https://github.com/splunk/splunk-connect-for-ethereum/issues/35)

## [2.0.5](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.4...v2.0.5) (2020-03-07)

### Bug Fixes

-   removed unnecessary dependency on web3-utils ([2939685](https://github.com/splunk/splunk-connect-for-ethereum/commit/2939685b6b8b1aca8e7e2e0625ba63dedf7742ca))

## [2.0.4](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.3...v2.0.4) (2020-03-07)

### Bug Fixes

-   🐛 adjusted log level during platform introspection ([291afd1](https://github.com/splunk/splunk-connect-for-ethereum/commit/291afd1953b5a41a4be4ca82cc4fc3eaad48bacd))

## [2.0.3](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.2...v2.0.3) (2020-03-07)

### Bug Fixes

-   🐛 deterministic signature order for anonymous ABI decoding ([8f0c380](https://github.com/splunk/splunk-connect-for-ethereum/commit/8f0c38012050ef2a3ddc440fa09d4a18233cb669))

## [2.0.2](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.1...v2.0.2) (2020-02-13)

### Bug Fixes

-   🐛 extended peer information now with dedicated config ([54bdfd9](https://github.com/splunk/splunk-connect-for-ethereum/commit/54bdfd990716db40d1109172cbdd9f3e0e08b362))

## [2.0.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v2.0.0...v2.0.1) (2020-02-12)

### Bug Fixes

-   🐛 avoid collecting pending transactions if not supported ([56863bd](https://github.com/splunk/splunk-connect-for-ethereum/commit/56863bdb2f458c97a9479585d8b21fe029024eed))

# [2.0.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v1.2.1...v2.0.0) (2020-02-11)

### Bug Fixes

-   🐛 ethlogger crashes when certain rpc methods are disabled ([ee56c01](https://github.com/splunk/splunk-connect-for-ethereum/commit/ee56c01caf8294d1992eaa3e501a0b15e71dc97b))
-   🐛 possible duplicate output of blocks ([80bb0da](https://github.com/splunk/splunk-connect-for-ethereum/commit/80bb0daabd4e7434c609dd362e047b888f0c049d))
-   🐛 too many pending transactions emitted ([7a01bb4](https://github.com/splunk/splunk-connect-for-ethereum/commit/7a01bb4ecc0caee2ef41053cf36f5f0027e9f33d))

### Features

-   🎸 anonymous ABI decoding ([e6eb3d9](https://github.com/splunk/splunk-connect-for-ethereum/commit/e6eb3d98fd7c2cc22af818b2966d7eac40a995a5)), closes [#20](https://github.com/splunk/splunk-connect-for-ethereum/issues/20)
-   🎸 support for CHAIN_ID (EIP-155) and common name lookup ([0dfff09](https://github.com/splunk/splunk-connect-for-ethereum/commit/0dfff09ef7ff95faf43084159e6cee34bdc52983))

### BREAKING CHANGES

-   🧨 Anonymous ABI decoding is enabled by default
-   🧨 Pending transaction collection is now disabled by default

## [1.2.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v1.2.0...v1.2.1) (2020-01-30)

### Bug Fixes

-   🐛 error decoding log events with no topics ([2dad7dc](https://github.com/splunk/splunk-connect-for-ethereum/commit/2dad7dcc9e22ce62082cd4c292019541ba54ab19))
-   🐛 geth node introspection if nodeInfo method is disabled ([e3f04a0](https://github.com/splunk/splunk-connect-for-ethereum/commit/e3f04a00b333576f320996428f874b24851e6b82))

# [1.2.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v1.1.1...v1.2.0) (2020-01-16)

### Bug Fixes

-   🐛 improved debug logging for ABI repository ([1948fcb](https://github.com/splunk/splunk-connect-for-ethereum/commit/1948fcbe00ccead37578f4c7e7a978879680f8e1))

### Features

-   🎸 support for quorum nodes with raft consensus ([e2186e2](https://github.com/splunk/splunk-connect-for-ethereum/commit/e2186e28985f25a19469219ea97423119faa16ef))

## [1.1.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v1.1.0...v1.1.1) (2020-01-10)

### Bug Fixes

-   allow variables in HEC user-agent ([dcb5cb8](https://github.com/splunk/splunk-connect-for-ethereum/commit/dcb5cb830dbdfb03570511d55aed29f5b8c0a622))

# [1.1.0](https://github.com/splunk/splunk-connect-for-ethereum/compare/v1.0.2...v1.1.0) (2020-01-10)

### Bug Fixes

-   🐛 cleanup of CLI help information ([029b16d](https://github.com/splunk/splunk-connect-for-ethereum/commit/029b16d85417f90386bb5da167b8f89ef1eaa249))

### Features

-   🎸 allow for not collecting block information ([1e44dd5](https://github.com/splunk/splunk-connect-for-ethereum/commit/1e44dd52b4fce7e4f4749cd82f398eef8e8c31b5))

## [1.0.2](https://github.com/splunk/splunk-connect-for-ethereum/compare/v1.0.1...v1.0.2) (2020-01-08)

### Bug Fixes

-   revert change to run ethlogger as unprivileged user for now ([cdea011](https://github.com/splunk/splunk-connect-for-ethereum/commit/cdea011ae3316bab6fb80d33c74ba96c0e6c9865))

## [1.0.1](https://github.com/splunk/splunk-connect-for-ethereum/compare/v1.0.0...v1.0.1) (2020-01-05)

### Bug Fixes

-   run ethlogger in docker as unprivileged user ([8155cee](https://github.com/splunk/splunk-connect-for-ethereum/commit/8155cee91aee4de30905232a727d5ea82c912512))

# 1.0.0 (2020-01-03)

### Features

-   initial release ([8cf4763](https://github.com/splunk/splunk-connect-for-ethereum/commit/8cf47636441f6ca72c589be0ffbc65086dcfbe5f))
