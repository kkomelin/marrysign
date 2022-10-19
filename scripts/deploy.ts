import { ethers } from 'hardhat'

async function main() {
  const MarrySignContract = await ethers.getContractFactory('MarrySign')
  const deployingContract = await MarrySignContract.deploy('First message')

  await deployingContract.deployed()

  console.log(`MarrySign contract has been deployed to ${deployingContract.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
