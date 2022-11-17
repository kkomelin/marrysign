# MarrySign (Backend) 
MarrySign app allows any couple regardless of time, age, location, culture or gender to get married online. Our marital agreements are stored on Blockchain, which makes them indestructible and verifiable.

This repository contains the blockchain/back-end part of the project which is developed with Solidity and Hardhat, and is aimed to be deployed on an Ethereum-compatible network (currently Goerli).

_The project is developed during [Chainlink Hackathon Fall 2022](https://hack.chain.link/?utm_source=marrysign) (Oct 14 - Nov 18, 2022)._

## Demo

[MarrySign.com](https://marrysign.com/) (Goerli network)

## Frontend Part

[kkomelin/marrysign-com](https://github.com/kkomelin/marrysign-com)

## Chainlink Services Used

We receive agreement termination cost from user in USD and store it on chain in USD (see `Agreement.terminationCost` in [kkomelin/marrysign/contracts/MarrySign.sol](https://github.com/kkomelin/marrysign/blob/main/contracts/MarrySign.sol) ), so Chainlink Price Feed is used to convert the termination cost to ETH on agreement termination in the `MarrySign.terminateAgreement()` function of the contract as well as on the front-end level.

A special [kkomelin/marrysign/contracts/CurrencyConverter.sol](https://github.com/kkomelin/marrysign/blob/main/contracts/CurrencyConverter.sol) library is developed to encapsulate currency conversion logic and communication with the Chainlink service.

On the front-end level, we display ETH equivalent of the USD amount on the Create Agreement, Accept Agreement and Terminate Agreement forms, which is obtained from Chainlink Price Feed in Web2 way. See [kkomelin/marrysign-com/lib/services/chainlink/index.ts](https://github.com/kkomelin/marrysign-com/blob/main/lib/services/chainlink/index.ts)

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

- Cannot terminate an agreement on Goerli #1

## Bugs, typos and suggestions

You're very welcome with your bug reports and suggestions here in the [issue queue](https://github.com/kkomelin/marrysign/issues/new), or just drop [Konstantin](https://github.com/kkomelin) a line on Twitter [@kkomelin](https://twitter.com/kkomelin).
