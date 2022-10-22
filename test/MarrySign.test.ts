import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { MarrySign } from '../typechain'
import { AgreementEventName } from '../types/AgreementEventName'
import { AgreementState } from '../types/AgreementState'
import { deployMarrySignContractFixture } from './utils/fixtures'
import {
  nowTimestamp,
  stringToHex,
  terminationServiceFee,
} from './utils/helpers'

describe('MarrySign', () => {
  let contract: MarrySign
  let owner: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  const terminationCost = 1000000
  const serviceFeePercent = 10 // Have to hardcode it here for now.
  const serviceFee = terminationServiceFee(terminationCost, serviceFeePercent)

  beforeEach(async () => {
    const fixtureResults = await loadFixture(deployMarrySignContractFixture)

    contract = fixtureResults.contract
    owner = fixtureResults.owner
    alice = fixtureResults.alice
    bob = fixtureResults.bob

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
      .to.emit(contract, AgreementEventName.AgreementCreated)
      .withArgs(captureIndex)

    const agreement = await contract.callStatic.getAgreement(0)
    expect(agreement.alice).to.be.equal(alice.address)
    expect(agreement.bob).to.be.equal(bob.address)
    expect(agreement.state).to.be.equal(AgreementState.Created)
    expect(agreement.updatedAt).to.be.equal(createdAt)
    expect(agreement.terminationCost).to.be.equal(terminationCost)
    expect(agreement.content).to.be.equal(content)

    return capturedIndex
  }

  describe('Contract Deployment', () => {
    it('Should revert if the index is out of range', async () => {
      await expect(contract.getAgreement(100)).to.be.revertedWith(
        'Index is out of range'
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

  describe('Agreement Acceptance', () => {
    it('Should revert if Alice tries to accept an agreement', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      const acceptedAt = nowTimestamp()

      await expect(
        contract.connect(alice).acceptAgreement(index, acceptedAt)
      ).to.be.revertedWith('Not allowed')
    })

    it('Should revert if the passed index is out of range', async () => {
      const index = 100
      const acceptedAt = nowTimestamp()

      await expect(
        contract.connect(bob).acceptAgreement(index, acceptedAt)
      ).to.be.revertedWith('Index is out of range')
    })

    it('Bob should accept an agreement', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      const acceptedAt = nowTimestamp()

      await expect(contract.connect(bob).acceptAgreement(index, acceptedAt))
        .to.emit(contract, AgreementEventName.AgreementAccepted)
        .withArgs(index)

      const agreement = await contract.callStatic.getAgreement(index)
      expect(agreement.state).to.be.equal(AgreementState.Accepted)
      expect(agreement.updatedAt).to.be.equal(acceptedAt)
    })
  })

  describe('Agreement Refusal', () => {
    it('Should revert if the passed index is out of range', async () => {
      const index = 100
      const refusedAt = nowTimestamp()

      await expect(
        contract.connect(alice).refuseAgreement(index, refusedAt)
      ).to.be.revertedWith('Index is out of range')
    })

    it('Should revert if it is refused by neither Alice or Bob', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      const refuseAt = nowTimestamp()

      await expect(
        contract.connect(owner).refuseAgreement(index, refuseAt)
      ).to.be.revertedWith('Not allowed')
    })

    it('Bob should be able to refuse their agreement', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      const refusedAt = nowTimestamp()

      await expect(contract.connect(bob).refuseAgreement(index, refusedAt))
        .to.emit(contract, AgreementEventName.AgreementRefused)
        .withArgs(index)

      const agreement = await contract.callStatic.getAgreement(index)
      expect(agreement.state).to.be.equal(AgreementState.Refused)
      expect(agreement.updatedAt).to.be.equal(refusedAt)
    })

    it('Alice should be able to refuse their agreement', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      const refusedAt = nowTimestamp()

      await expect(contract.connect(alice).refuseAgreement(index, refusedAt))
        .to.emit(contract, AgreementEventName.AgreementRefused)
        .withArgs(index)

      const agreement = await contract.callStatic.getAgreement(index)
      expect(agreement.state).to.be.equal(2)
      expect(agreement.updatedAt).to.be.equal(refusedAt)
    })
  })

  describe('Agreement Termination', () => {
    it('Should revert if it is terminated by neither Alice or Bob', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      await expect(
        contract.connect(owner).terminateAgreement(index)
      ).to.be.revertedWith('Not allowed')
    })

    it('Should revert if no payment is performed', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      await expect(
        contract.connect(bob).terminateAgreement(index)
      ).to.be.revertedWith(
        'The terminating party must pay the exact termination cost'
      )
    })

    it('Bob should be able to terminate an agreement with penalty', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      await expect(
        contract.connect(bob).terminateAgreement(index, {
          value: terminationCost,
        })
      )
        .to.emit(contract, AgreementEventName.AgreementTerminated)
        .withArgs(index)
        .to.changeEtherBalances(
          [bob, alice, owner],
          [-terminationCost, terminationCost - serviceFee, serviceFee]
        )

      // @todo: When we find a way to delete the array element completely, update this check.
      const agreement = await contract.callStatic.getAgreement(index)
      expect(agreement.state).to.be.equal(AgreementState.Terminated)
    })

    it('Alice should be able to terminate an agreement with penalty', async () => {
      const index = await _createAgreement(contract, alice, bob)
      expect(index).to.be.equal(0)

      await expect(
        contract.connect(alice).terminateAgreement(index, {
          value: terminationCost,
        })
      )
        .to.emit(contract, AgreementEventName.AgreementTerminated)
        .withArgs(index)
        .to.changeEtherBalances(
          [alice, bob, owner],
          [-terminationCost, terminationCost - serviceFee, serviceFee]
        )

      // @todo: When we find a way to delete the array element completely, update this check.
      const agreement = await contract.callStatic.getAgreement(index)
      expect(agreement.state).to.be.equal(AgreementState.Terminated)
    })
  })
})
