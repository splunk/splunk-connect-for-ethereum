# Developing Splunk Connect for Ethereum

## Set up development environment

**Prerequisites**

-   [Node.js](https://nodejs.org/) 12
-   [Yarn package manager](https://yarnpkg.com/) (recent/latest version)
-   [Rust toolchain](https://rustup.rs/) (rustc 1.41.0)
-   [wasm-pack](https://rustwasm.github.io/wasm-pack/) (recent/latest version)
-   [Docker](https://www.docker.com/) to build docker images

1. Clone the respository
2. Install dependencies

```sh-session
$ yarn install
```

3. Run ethlogger

```sh-session
$ ./bin/run --help
```

### Build ethlogger

```sh-session
$ yarn build
```

### Build ethlogger docker image

```sh-session
$ docker build -t ethlogger .
```

## Debugging

### Enable debug or trace logging

You can use ethloggers CLI flags `--debug` or `--trace` to

```sh-session
$ ./bin/run --debug ...
or
$ DEBUG=ethlogger:abi:* ./bin/run --trace ...
```

> Note that `--trace` is very verbose

Under the hood, ethlogger uses the [debug](https://yarnpkg.com/en/package/debug) utility, which is also used by other third-party libraries used within ethlogger. Ethloggers own logger name all start with `ethlogger:`. To enable debugging for other libraries you can set the `DEBUG` environment variable appropriately, for example:

```sh-session
$ DEBUG=@oclif* ./bin/run...
```

You can also use the `DEBUG` environment variable to just enable debugging for a single component of ethlogger.

```sh-session
$ DEBUG=ethlogger:hec:* ./bin/run ...
```

### Attach a debugger to the node process

One easy way to attach an external debugger to ethlogger is to set the `NODE_OPTIONS` environment variable to `--inspect` or `--inspect-brk`.

```sh-session
NODE_OPTIONS=--inspect-brk ./bin/run ...
```

Then use a compatible tool to connect to the node process. To use Chrome dev-tools, open Chrome and navigate to `chrome://inspect`, then select the node process from the list to attach the debugger.

## Code style

The ethlogger codebase employs certain rules regarding code style. Rule are defined in config files and enforced by CI:

-   [.editorconfig](../.editorconfig) ([Learn more](https://editorconfig.org/))
-   [.eslintrc](../.eslintrc) ([Learn more](https://eslint.org/))
-   [.prettierrc](../.prettierrc) ([Learn more](https://prettier.io/))

### Formatting

This project uses [prettier](https://github.com/prettier/prettier) to ensure consistent code formatting. You may want to [add a prettier plugin to your editor/ide](https://github.com/prettier/prettier#editor-integration) for a smooth experience.

Prettier will automatically format changed files as they are committed to the repo via a pre-commit hook. In addition you can re-format all files in the codebase by running:

```sh-session
$ yarn format
```

To manually verify formatting there is also a command to check all files:

```sh-session
$ yarn format:verify
```

This is also run in CI and the check will fail if any file is not properly formatted.

### Linting

We are using [eslint](https://eslint.org) to enforce certain code style rules. Violation will caues CI checks not to pass. You can locally run eslint to check for any potential linter warning or errors:

```sh-session
$ yarn lint
```

Eslint can also automatically fix certain errors automatically if you pass the `--fix` option.

```sh-session
$ yarn lint --fix
```

## Run tests

There are several unit tests in this repo. In order for CI checks to pass, all tests need to complete successfully.

To execute them, simply run:

```sh-session
$ yarn test
```

You can also execute tests in watch mode, which will automatically re-run tests as you make changes:

```sh-session
$ yarn test --watch
```
