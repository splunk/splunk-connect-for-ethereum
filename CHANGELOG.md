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
