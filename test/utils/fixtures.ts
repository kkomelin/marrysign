import { ethers } from 'hardhat'

export const _deployMarrySignContractFixture = async () => {
  // Contracts are deployed using the first signer/account by default.
  const [owner, alice, bob] = await ethers.getSigners()

  const MarrySignContract = await ethers.getContractFactory('MarrySign')
  const contract = await MarrySignContract.deploy()

  return { contract, owner, alice, bob }
}
