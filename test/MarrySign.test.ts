import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { MarrySign } from '../typechain'

describe('MarrySign', () => {
  let contract: MarrySign
  let owner: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  const terminationCost = 1000000
  // const terminationServiceFee =
  //   terminationCost / contract.callStatic.SERVICE_FEE_PERCENT

  beforeEach(async () => {
    const fixtureResults = await loadFixture(_deployContractFixture)

    contract = fixtureResults.contract
    owner = fixtureResults.owner
    alice = fixtureResults.alice
    bob = fixtureResults.alice

    return fixtureResults
  })

  const _deployContractFixture = async () => {
    // Contracts are deployed using the first signer/account by default.
    const [owner, alice, bob] = await ethers.getSigners()

    const MarrySignContract = await ethers.getContractFactory('MarrySign')
    const contract = await MarrySignContract.deploy()

    return { contract, owner, alice, bob }
  }

  const _createAgreement = async (
    contract: MarrySign,
    alice: SignerWithAddress,
    bob: SignerWithAddress
  ) => {
    // Get createdAt timestamp in seconds.
    const createdAt = Math.round(Date.now() / 1000)

    // Prepare some test content.
    const content = ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Test vow'))

    // Capture agreement index in case a few contracts created one by one.
    let capturedIndex: number = -1
    const captureIndex = (index: number) => {
      capturedIndex = index
      return true
    }

    await expect(
      contract
        .connect(alice)
        .createAgreement(bob.address, content, terminationCost, createdAt)
    )
      .to.emit(contract, 'Created')
      .withArgs(captureIndex)

    const agreement = await contract.callStatic.getAgreement(0)
    expect(agreement.alice).to.be.equal(alice.address)
    expect(agreement.bob).to.be.equal(bob.address)
    expect(agreement.state).to.be.equal(0)
    expect(agreement.updatedAt).to.be.equal(createdAt)
    expect(agreement.terminationCost).to.be.equal(terminationCost)
    expect(agreement.content).to.be.equal(content)

    return capturedIndex
  }

  describe('Deployment', function () {
    it('Should revert if the index is out of range', async () => {
      await expect(contract.getAgreement(100)).to.be.revertedWith(
        'Index out of range'
      )
    })
  })

  describe('Creation', function () {
    it('Should create an agreement and emit event for correct parameters', async function () {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      const count = await contract.callStatic.getAgreementCount()
      expect(count).to.be.equal(1)
    })

    it('Should create multiple agreements', async function () {
      const index1 = await _createAgreement(contract, alice, bob)
      expect(index1).to.be.equal(0)
      const index2 = await _createAgreement(contract, alice, bob)
      expect(index2).to.be.equal(1)

      const count = await contract.callStatic.getAgreementCount()
      expect(count).to.be.equal(2)
    })
  })
})
