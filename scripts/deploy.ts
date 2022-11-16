import { network, run } from 'hardhat'
import { localNetworks } from '../hardhat.config.extra'
import { deployContracts } from '../lib/deploy'

deployContracts()
  .then((results) => {
    console.log(
      `MockV3Aggregator contract has been deployed to ${results.mockV3AggregatorContract.address}`
    )
    console.log(
      `MarrySign contract has been deployed to ${results.marrySignContract.address}`
    )

    // Verify on Etherscan.
    if (
      !localNetworks.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
    ) {
      run('verify:verify', {
        address: results.marrySignContract.address,
        constructorArguments: [results.mockV3AggregatorContract.address],
      })
        .then(() => {})
        .catch((e) => {
          console.error(e)
          process.exit(1)
        })
    }

    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
