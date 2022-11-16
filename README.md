# MarrySign (Backend) 
MarrySign app allows any couple to get married online.

This repository contains the blockchain/back-end part of the project which is aimed to be run on an Ethereum-compatible network.

_The project is developed during [Chainlink Hackathon Fall 2022](https://hack.chain.link/) (Oct 14 - Nov 18, 2022)._

## Demo

[MarrySign.com](https://marrysign.com/) **(Goerli network only atm)**

## Chainlink Services Used

We receive agreement termination cost from user in USD and store it on chain in USD (see `Agreement.terminationCost` in [kkomelin/marrysign/contracts/MarrySign.sol](https://github.com/kkomelin/marrysign/contracts/MarrySign.sol) ), so Chainlink Price Feed is used to convert the termination cost to ETH on agreement termination in the `MarrySign.terminateAgreement()` function of the contract as well as on the front-end level.

A special [kkomelin/marrysign/contracts/CurrencyConverter.sol](https://github.com/kkomelin/marrysign/contracts/CurrencyConverter.sol) library is written to encapsulate currency conversion logic and communication with the Chainlink service.

On the front-end level, we display ETH equivalent of the USD amount on the Create Agreement, Accept Agreement and Terminate Agreement forms, which is obtained from Chainlink Price Feed in Web2 way. See [kkomelin/marrysign.com/lib/services/chainlink/index.ts](https://github.com/kkomelin/marrysign.com/lib/services/chainlink/index.ts)


## Install

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

# Code docs

[here](https://github.com/kkomelin/marrysign/blob/main/docs/index.md)
