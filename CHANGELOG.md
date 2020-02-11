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
