# MarrySign (Backend/Blockchain)
MarrySign app allows any couple regardless of time, age, location, culture or gender to get married online. Our marital agreements are stored on Blockchain, which makes them indestructible and verifiable.

_The initial version of this project has been developed during [Chainlink Hackathon Fall 2022](https://devpost.com/software/marrysign) (Oct 14 - Nov 18, 2022)._

## Configuration

See [kkomelin/marrysign/.example.env](https://github.com/kkomelin/marrysign/blob/main/.example.env) for reference.

Copy `.example.env` to `.env` and update the variables with your values.

## Installation

**Please note only NPM is supported at the moment.**

```shell
npm install
```

## Test

Run automated tests:

```shell
npm run test
```

Run automated tests and estimate Gas consumption:

```shell
npm run test:gas
```

Run automated tests and calculate coverage:

```shell
npm run test:coverage
```

## Run test network

```shell
npm run network
```

## Compile and deploy the contract to the test network

```shell
npm run compile
npm run deploy
```

## Code documentation

The auto-generated code documentaiton is [here](https://github.com/kkomelin/marrysign/blob/main/docs/index.md)

## Known Issues

- [Cannot terminate an agreement on Goerli #1](https://github.com/kkomelin/marrysign/issues/1)

## Bugs, typos and suggestions

You're very welcome with your bug reports and suggestions here in the [issue queue](https://github.com/kkomelin/marrysign/issues/new), or just drop [Konstantin](https://github.com/kkomelin) a line on Twitter [@kkomelin](https://twitter.com/kkomelin).
