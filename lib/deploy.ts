import { ethers, network } from 'hardhat'
import {
  MOCK_PRICE_FEED_DECIMALS,
  MOCK_PRICE_FEED_INITIAL_PRICE,
} from '../config/main'
import { extraNetworkConfig, localNetworks } from '../hardhat.config.extra'

export async function deployContracts() {
  let priceFeedAddress = ''
  let resultsAC: any = {}

  // If it's a local development network, deploy mocks.
  if (localNetworks.includes(network.name)) {
    resultsAC = await deployMockV3AggregatorContract()
    priceFeedAddress = resultsAC.mockV3AggregatorContract.address
  } else {
    priceFeedAddress = extraNetworkConfig.goerli.ethUsdPriceFeed
    resultsAC = { mockV3AggregatorContract: { address: priceFeedAddress } }
  }
  // @todo: Add priceFeedAddress for production.

  const resultsMS = await deployMarrySignContract(priceFeedAddress)

  return {
    ...resultsAC,
    ...resultsMS,
  }
}

const deployMockV3AggregatorContract = async () => {
  const MockV3AggregatorContract = await ethers.getContractFactory(
    'MockV3Aggregator'
  )
  const contract = await MockV3AggregatorContract.deploy(
    MOCK_PRICE_FEED_DECIMALS,
    MOCK_PRICE_FEED_INITIAL_PRICE
  )

  await contract.deployed()

  return { mockV3AggregatorContract: contract }
}

const deployMarrySignContract = async (priceFeedAddress: string) => {
  // Contracts are deployed using the first signer/account by default.
  const [owner, alice, bob] = await ethers.getSigners()

  const MarrySignContract = await ethers.getContractFactory('MarrySign')
  const contract = await MarrySignContract.deploy(priceFeedAddress)

  await contract.deployed()

  return { marrySignContract: contract, owner, alice, bob }
}
