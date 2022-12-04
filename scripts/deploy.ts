import { network, run } from 'hardhat'
import { LOCAL_NETWORKS } from '../config/main'
import { deployContracts } from '../lib/deploy'

async function main() {
  const results = await deployContracts()

  await verify(results.contract.address)
}

async function verify(marrySignContractAddress: string) {
  if (!LOCAL_NETWORKS.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await run('verify:verify', {
      address: marrySignContractAddress,
      constructorArguments: [],
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
