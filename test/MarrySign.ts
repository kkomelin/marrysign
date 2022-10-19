import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

const TEST_MESSAGE = 'Test message'

describe('MarrySign', function () {
  async function deployMarrySignFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const testMessage = TEST_MESSAGE

    const MarrySignContract = await ethers.getContractFactory('MarrySign')
    const contract = await MarrySignContract.deploy(testMessage)

    return { contract, owner, otherAccount }
  }

  describe('Deployment', function () {
    it('Should set correct message', async function () {
      const { contract } = await loadFixture(deployMarrySignFixture)

      const testMessage = TEST_MESSAGE

      expect(await contract.getMessage()).to.equal(testMessage)
    })
  })
})
