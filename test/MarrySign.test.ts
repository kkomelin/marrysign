import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BytesLike } from 'ethers'
import { ethers } from 'hardhat'
import { MarrySign } from '../typechain'
import { EAgreementEventName } from '../types/EAgreementEventName'
import { EAgreementState } from '../types/EAgreementState'
import { ECustomContractError } from '../types/ECustomContractError'
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
    const agreementData = {
      partner1: {
        name: 'Alice Smith',
      },
      partner2: {
        name: 'Bob Jones',
      },
      vow: 'Test vow',
    }

    const content = stringToHex(JSON.stringify(agreementData))

    // Capture agreement index in case a few contracts created one by one.
    let capturedId: BytesLike = ethers.utils.hexZeroPad(
      ethers.utils.hexlify(0),
      32
    )
    const captureId = (id: BytesLike) => {
      capturedId = id
      return true
    }

    await expect(
      contract
        .connect(alice)
        .createAgreement(bob.address, content, terminationCost, createdAt)
    )
      .to.emit(contract, EAgreementEventName.AgreementCreated)
      .withArgs(captureId)

    const agreement = await contract.callStatic.getAgreement(capturedId)
    expect(agreement.alice).to.be.equal(alice.address)
    expect(agreement.bob).to.be.equal(bob.address)
    expect(agreement.state).to.be.equal(EAgreementState.Created)
    expect(agreement.updatedAt).to.be.equal(createdAt)
    expect(agreement.terminationCost).to.be.equal(terminationCost)
    expect(agreement.content).to.be.equal(content)

    return capturedId
  }

  describe('Contract: Deployment', () => {
    it('Should revert if the passed ID does not exist', async () => {
      const nonExistentId = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

      await expect(
        contract.getAgreement(nonExistentId)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AgreementNotFound
      )
    })
  })

  describe('Agreement: Getters', () => {
    it("Should return the active agreement by Alice's address", async () => {
      const id = await _createAgreement(contract, alice, bob)

      const agreement = await contract.callStatic.getAgreementByAddress(
        alice.address
      )
      expect(id).to.be.equal(agreement.id)
      expect(agreement.alice).to.be.equal(alice.address)
      expect(agreement.bob).to.be.equal(bob.address)
      expect(agreement.state).to.be.equal(EAgreementState.Created)
    })

    it("Should return the active agreement by Bob's address", async () => {
      const id = await _createAgreement(contract, alice, bob)

      const agreement = await contract.callStatic.getAgreementByAddress(
        bob.address
      )
      expect(id).to.be.equal(agreement.id)
      expect(agreement.alice).to.be.equal(alice.address)
      expect(agreement.bob).to.be.equal(bob.address)
      expect(agreement.state).to.be.equal(EAgreementState.Created)
    })

    it('Should return all accepted agreements', async () => {
      const id1 = await _createAgreement(contract, alice, bob)
      await contract.connect(bob).acceptAgreement(id1, nowTimestamp())

      // Creates an agreement in Created state which should be omitted from results.
      await _createAgreement(contract, alice, bob)

      const id3 = await _createAgreement(contract, alice, bob)
      await contract.connect(bob).acceptAgreement(id3, nowTimestamp())

      const agreements = await contract.callStatic.getAcceptedAgreements()
      expect(2).to.be.equal(agreements.length)

      const actualAgrement1 = agreements[0]
      expect(id1).to.be.equal(actualAgrement1.id)
      expect(actualAgrement1.alice).to.be.equal(alice.address)
      expect(actualAgrement1.bob).to.be.equal(bob.address)
      expect(actualAgrement1.state).to.be.equal(EAgreementState.Accepted)

      const actualAgrement3 = agreements[1]
      expect(id3).to.be.equal(actualAgrement3.id)
      expect(actualAgrement3.alice).to.be.equal(alice.address)
      expect(actualAgrement3.bob).to.be.equal(bob.address)
      expect(actualAgrement3.state).to.be.equal(EAgreementState.Accepted)
    })

    it("Should not return an inactive agreement by Alice's address if the agreement has been refused already", async () => {
      const id = await _createAgreement(contract, alice, bob)

      await contract.connect(bob).refuseAgreement(id, nowTimestamp())

      await expect(
        contract.callStatic.getAgreementByAddress(alice.address)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AgreementNotFound
      )
    })
  })

  describe('Agreement: Creation', () => {
    it('Should revert if parameters are invalid', async () => {
      let content = stringToHex('Test vow')
      let terminationCost = 100
      let createdAt = 0

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.InvalidTimestamp
      )

      content = stringToHex('')
      terminationCost = 100
      createdAt = nowTimestamp()

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.EmptyContent
      )

      content = stringToHex('Test vow')
      terminationCost = 0
      createdAt = nowTimestamp()

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.ZeroTerminationCost
      )
    })

    it('Should create an agreement and emit event for correct parameters', async () => {
      await _createAgreement(contract, alice, bob)

      const count = await contract.callStatic.getAgreementCount()
      expect(count).to.be.equal(1)
    })

    it('Should create multiple agreements', async () => {
      const id1 = await _createAgreement(contract, alice, bob)
      const id2 = await _createAgreement(contract, alice, bob)

      // Should make sure that the ids are unique.
      expect(id1).to.be.not.equal(id2)

      const count = await contract.callStatic.getAgreementCount()
      expect(count).to.be.equal(2)
    })
  })

  describe('Agreement: Acceptance', () => {
    it('Should revert if Alice tries to accept an agreement', async () => {
      const id = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(alice).acceptAgreement(id, nowTimestamp())
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AccessDenied
      )
    })

    it('Should revert if the passed ID does not exist', async () => {
      const nonExistentId = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

      await expect(
        contract.connect(bob).acceptAgreement(nonExistentId, nowTimestamp())
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AgreementNotFound
      )
    })

    it('Bob should accept an agreement', async () => {
      const id = await _createAgreement(contract, alice, bob)

      const acceptedAt = nowTimestamp()
      await expect(contract.connect(bob).acceptAgreement(id, acceptedAt))
        .to.emit(contract, EAgreementEventName.AgreementAccepted)
        .withArgs(id)

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Accepted)
      expect(agreement.updatedAt).to.be.equal(acceptedAt)
    })
  })

  describe('Agreement: Refusal', () => {
    it('Should revert if the passed ID does not exist', async () => {
      const nonExistentId = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

      await expect(
        contract.connect(alice).refuseAgreement(nonExistentId, nowTimestamp())
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AgreementNotFound
      )
    })

    it('Should revert if it is refused by neither Alice or Bob', async () => {
      const id = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(owner).refuseAgreement(id, nowTimestamp())
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AccessDenied
      )
    })

    it('Bob should be able to refuse their agreement', async () => {
      const id = await _createAgreement(contract, alice, bob)

      const refusedAt = nowTimestamp()
      await expect(contract.connect(bob).refuseAgreement(id, refusedAt))
        .to.emit(contract, EAgreementEventName.AgreementRefused)
        .withArgs(id)

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Refused)
      expect(agreement.updatedAt).to.be.equal(refusedAt)
    })

    it('Alice should be able to refuse their agreement', async () => {
      const id = await _createAgreement(contract, alice, bob)

      const refusedAt = nowTimestamp()
      await expect(contract.connect(alice).refuseAgreement(id, refusedAt))
        .to.emit(contract, EAgreementEventName.AgreementRefused)
        .withArgs(id)

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(2)
      expect(agreement.updatedAt).to.be.equal(refusedAt)
    })
  })

  describe('Agreement: Termination', () => {
    it('Should revert if it is terminated by neither Alice or Bob', async () => {
      const id = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(owner).terminateAgreement(id)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AccessDenied
      )
    })

    it('Should revert if no payment is performed', async () => {
      const id = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(bob).terminateAgreement(id)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.MustPayExactTerminationCost
      )
    })

    it('Bob should be able to terminate an agreement with penalty', async () => {
      const id = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(bob).terminateAgreement(id, {
          value: terminationCost,
        })
      )
        .to.emit(contract, EAgreementEventName.AgreementTerminated)
        .withArgs(id)
        .to.changeEtherBalances(
          [bob, alice, owner],
          [-terminationCost, terminationCost - serviceFee, serviceFee]
        )

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Terminated)
    })

    it('Alice should be able to terminate an agreement with penalty', async () => {
      const id = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(alice).terminateAgreement(id, {
          value: terminationCost,
        })
      )
        .to.emit(contract, EAgreementEventName.AgreementTerminated)
        .withArgs(id)
        .to.changeEtherBalances(
          [alice, bob, owner],
          [-terminationCost, terminationCost - serviceFee, serviceFee]
        )

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Terminated)
    })
  })

  describe('Agreement: List of Accepted', () => {
    it('Should return only accepted agreements', async () => {
      const id1 = await _createAgreement(contract, alice, bob)
      const id2 = await _createAgreement(contract, alice, bob)
      const id3 = await _createAgreement(contract, alice, bob)

      await expect(contract.connect(bob).acceptAgreement(id2, nowTimestamp()))
        .to.emit(contract, EAgreementEventName.AgreementAccepted)
        .withArgs(id2)

      const agreements = await contract.getAcceptedAgreements()
      expect(agreements.length).to.be.equal(1)

      const agreement = agreements[0]
      expect(id2).to.be.equal(agreement.id)
      expect(agreement.state).to.be.equal(EAgreementState.Accepted)
      expect(agreement.alice).to.be.equal(alice.address)
    })
  })

  describe('Contract: Withdrawal', () => {
    it('Should revert if called by not the owner', async () => {
      await expect(
        contract.connect(alice).withdraw()
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.CallerIsNotOwner
      )
    })

    it('Should not revert if called by the owner', async () => {
      await expect(contract.withdraw()).to.changeEtherBalances([owner], [0]).not
        .to.be.reverted
    })
  })
})
