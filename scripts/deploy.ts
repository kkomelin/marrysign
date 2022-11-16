import { deployContracts } from '../lib/deploy'

deployContracts()
  .then((results) => {
    console.log(
      `MockV3Aggregator contract has been deployed to ${results.mockV3AggregatorContract.address}`
    )
    console.log(
      `MarrySign contract has been deployed to ${results.marrySignContract.address}`
    )
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
