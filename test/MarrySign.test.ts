import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { MarrySign } from '../typechain'
import { _deployMarrySignContractFixture } from './utils/fixtures'
import { nowTimestamp, stringToHex } from './utils/helpers'

describe('MarrySign', () => {
  let contract: MarrySign
  let owner: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  const terminationCost = 1000000
  // const terminationServiceFee =
  //   terminationCost / contract.callStatic.SERVICE_FEE_PERCENT

  beforeEach(async () => {
    const fixtureResults = await loadFixture(_deployMarrySignContractFixture)

    contract = fixtureResults.contract
    owner = fixtureResults.owner
    alice = fixtureResults.alice
    bob = fixtureResults.alice

    return fixtureResults
  })

  const _createAgreement = async (
    contract: MarrySign,
    alice: SignerWithAddress,
    bob: SignerWithAddress
  ) => {
    const createdAt = nowTimestamp()
    const content = stringToHex('Test vow')

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
    // Initially an agreement is created in Created state (0).
    expect(agreement.state).to.be.equal(0)
    expect(agreement.updatedAt).to.be.equal(createdAt)
    expect(agreement.terminationCost).to.be.equal(terminationCost)
    expect(agreement.content).to.be.equal(content)

    return capturedIndex
  }

  describe('Contract Deployment', () => {
    it('Should revert if the index is out of range', async () => {
      await expect(contract.getAgreement(100)).to.be.revertedWith(
        'Index out of range'
      )
    })
  })

  describe('Agreement Creation', () => {
    it('Should revert if parameters are invalid', async () => {
      let content = stringToHex('Test vow')
      let terminationCost = 100
      let createdAt = 0

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.rejectedWith('Invalid timestamp')

      content = stringToHex('')
      terminationCost = 100
      createdAt = nowTimestamp()

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.rejectedWith('Content cannot be empty')

      content = stringToHex('Test vow')
      terminationCost = 0
      createdAt = nowTimestamp()

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.rejectedWith('Termination cost is not set')
    })

    it('Should create an agreement and emit event for correct parameters', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      const count = await contract.callStatic.getAgreementCount()
      expect(count).to.be.equal(1)
    })

    it('Should create multiple agreements', async () => {
      const index1 = await _createAgreement(contract, alice, bob)
      expect(index1).to.be.equal(0)
      const index2 = await _createAgreement(contract, alice, bob)
      expect(index2).to.be.equal(1)

      const count = await contract.callStatic.getAgreementCount()
      expect(count).to.be.equal(2)
    })
  })
})
