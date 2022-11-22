import { network, run } from 'hardhat'
import { localNetworks } from '../hardhat.config.extra'
import { deployContracts } from '../lib/deploy'
require('dotenv').config()

async function main() {
  const results = await deployContracts()

  await verify(
    results.marrySignContract.address,
    results.v3AggregatorContract.address
  )
}

async function verify(
  marrySignContractAddress: string,
  v3AggregatorContractAddress: string
) {
  if (
    !localNetworks.includes(network.name) &&
    (process.env.ETHERSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY)
  ) {
    await run('verify:verify', {
      address: marrySignContractAddress,
      constructorArguments: [v3AggregatorContractAddress],
    })
    return
  }

  console.log('Skip verifying the contract for local networks.')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
