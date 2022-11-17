import { network, run } from 'hardhat'
import { localNetworks } from '../hardhat.config.extra'

/// This script is to verify the contract on Etherscan after deployment.

const v3AggregatorContractAddress = '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e'
const marrySignContractAddress = '0xCce4880C3DAf296d87FE710953E12D008608C6A2'

async function main() {
  if (!localNetworks.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await run('verify:verify', {
      address: marrySignContractAddress,
      constructorArguments: [v3AggregatorContractAddress],
    })
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
