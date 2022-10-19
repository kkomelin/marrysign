import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

const TEST_MESSAGE = 'Test message'

describe('MarrySign', function () {
  async function deployMarrySignFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const MarrySignContract = await ethers.getContractFactory('MarrySign')
    const contract = await MarrySignContract.deploy(TEST_MESSAGE)

    return { contract, owner, otherAccount }
  }

  describe('Deployment', async () => {
    it('Should set correct message', async () => {
      const { contract } = await loadFixture(deployMarrySignFixture)

      expect(await contract.getMessage()).to.equal(TEST_MESSAGE)
    })
  })

  describe('#setMessage', async () => {
    describe('on failure', () => {
      it('Should revert if the message is empty', async () => {
        const { contract } = await loadFixture(deployMarrySignFixture)

        const newMessage = ''

        await expect(contract.setMessage(newMessage)).to.be.revertedWith(
          'Message cannot be empty'
        )
      })
      it('Should revert if the caller is not the owner', async () => {
        const { contract, otherAccount } = await loadFixture(
          deployMarrySignFixture
        )

        const newMessage = 'New message'

        await expect(
          contract.connect(otherAccount).setMessage(newMessage)
        ).to.be.revertedWith('Caller is not an owner')
      })
    })
    describe('on success', async () => {
      it('Should set the correct message', async () => {
        const { contract } = await loadFixture(deployMarrySignFixture)

        const newMessage = 'New message'

        await contract.setMessage(newMessage)

        expect(await contract.getMessage()).to.equal(newMessage)
      })
    })
  })
})
