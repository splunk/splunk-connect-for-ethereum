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

## Committing

This project uses [conventional commits](https://www.conventionalcommits.org/), which enforce a particular format for commit messages.

> The commit message should be structured as follows:
>
> ```
>    <type>[optional scope]: <description>
>
>    [optional body]
>
>    [optional footer(s)]
> ```
>
> The commit contains the following structural elements, to communicate intent to the
> consumers of your library:
>
> 1. **fix:** a commit of the _type_ `fix` patches a bug in your codebase (this correlates with [`PATCH`](http://semver.org/#summary) in semantic versioning).
> 1. **feat:** a commit of the _type_ `feat` introduces a new feature to the codebase (this correlates with [`MINOR`](http://semver.org/#summary) in semantic versioning).
> 1. **BREAKING CHANGE:** a commit that has a footer `BREAKING CHANGE:`, or appends a `!` after the type/scope, introduces a breaking API change (correlating with [`MAJOR`](http://semver.org/#summary) in semantic versioning).
>    A BREAKING CHANGE can be part of commits of any _type_.
> 1. _types_ other than `fix:` and `feat:` are allowed, for example [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional) (based on the [the Angular convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines)) recommends `build:`, `chore:`,
>    `ci:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, and others.
> 1. _footers_ other than `BREAKING CHANGE: <description>` may be provided and follow a convention similar to
>    [git trailer format](https://git-scm.com/docs/git-interpret-trailers).
>
> Additional types are not mandated by the Conventional Commits specification, and have no implicit effect in semantic versioning (unless they include a BREAKING CHANGE).
> <br /><br />
> A scope may be provided to a commit's type, to provide additional contextual information and is contained within parenthesis, e.g., `feat(parser): add ability to parse arrays`.

### Validation

A pre-commit hook provided by [Husky](https://github.com/typicode/husky#readme) checks that the message contents match a conventional commit.

If your changes are valid, you will see the following output:

```sh-session
husky > pre-commit (node v14.0.0)
🔍  Finding changed files since git revision ffffffff.
🎯  Found 1 changed file.
✍️  Updating docs/developing.md.
✅  Everything is awesome!
```

If your commit doesn't follow conventional commit guidelines, you will see this instead:

```sh-session
🔍  Finding changed files since git revision ffffffff.
🎯  Found 0 changed files.
✅  Everything is awesome!
husky > commit-msg (node v14.0.0)
⧗   input: This change adds documentation for contributors to help them understand

how the repository is managed.
It provides guidance on how to form commits using the git-cz tool.
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
⚠   body must have leading blank line [body-leading-blank]

✖   found 2 problems, 1 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint

husky > commit-msg hook failed (add --no-verify to bypass)
```

### Creating a conventional commit

You can write a conventional commit by following the guidelines above.

The specification contains a number of [examples.](https://www.conventionalcommits.org/en/v1.0.0/#examples)

You can also read prior commits for inspiration with `git log`.

### Using `git-cz`

git cz makes writing [semantic Git commits](https://github.com/streamich/git-cz) easy.

You can run `git-cz` with npx:

```sh-session
npx git-cz
```

You can also install git-cz globally:

```sh-session
npm install -g git-cz
```

Then you can run git-cz with:

```sh-session
git cz
```

Stage your changes as usual with `git add` and `git rm`, then run `git cz`.

A dialog will appear from which you can make a selection of the type of change:

```sh-session
? Select the type of change that you're committing:
  🎸  feat:       A new feature
  🐛  fix:        A bug fix
  🤖  chore:      Build process or auxiliary tool changes
❯ ✏️  docs:       Documentation only changes
  💡  refactor:   A code change that neither fixes a bug or adds a feature
  💄  style:      Markup, white-space, formatting, missing semi-colons...
  🎡  ci:         CI related changes
(Move up and down to reveal more choices)
```

After pressing Enter, you can enter a short description of the commit:

```sh-session
? Write a short, imperative mood description of the change:
  [-------------------------------------------------------------] 3 chars left
   docs: Document conventional commits and semantic releases.
```

You can then enter a longer description of the change:

```sh-session
? Provide a longer description of the change:
  This change adds documentation for contributors to help them understand how the repository is managed.
```

You can then list any breaking changes the code change introduces:

```sh-session
? List any breaking changes
  BREAKING CHANGE:
```

If you have no breaking change, you can press enter.

You can enter the number of the issue fixed by the commit:

```sh-session
? Issues this commit closes, e.g #123:
```

If no issues are fixed with the commit, you can press enter to bypass the prompt.

If you want to change the contents of the commit, you can run `git cz --amend`. [See more about `git commit --amend`.](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)

## Semantic releases

Whenever a change is made to the repository, a Github action runs `yarn semantic-release`.

This automates the release workflow, reading the commit messages to determine the next version number.

[Read more about the semantic release workflow here.](https://github.com/semantic-release/semantic-release)
