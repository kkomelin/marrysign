import { ethers } from 'hardhat'

export async function deployContracts() {
  return await deployMarrySignContract()
}

const deployMarrySignContract = async () => {
  // Contracts are deployed using the first signer/account by default.
  const [owner, alice, bob] = await ethers.getSigners()

  const MarrySignContract = await ethers.getContractFactory('MarrySign')
  const contract = await MarrySignContract.deploy()

  await contract.deployed()

  // @todo: Don't display when in tests.
  console.log(`MarrySign contract has been deployed to ${contract.address}`)

  return { contract, owner, alice, bob }
}
