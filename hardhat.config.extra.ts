const extraNetworkConfig = {
  localhost: {
    chainId: 31337,
    name: 'localhost',
  },
  hardhat: {
    chainId: 31337,
    name: 'hardhat',
  },
  // Price Feed Address from https://docs.chain.link/docs/reference-contracts
  goerli: {
    chainId: 5,
    name: 'goerli',
    ethUsdPriceFeed: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
  },
}

const localNetworks = ['localhost', 'hardhat']

export { extraNetworkConfig, localNetworks }
