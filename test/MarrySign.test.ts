import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber, BytesLike } from 'ethers'
import { ethers } from 'hardhat'
import { deployContracts } from '../lib/deploy'
import { MarrySign } from '../typechain'
import { EAgreementEventName } from '../types/EAgreementEventName'
import { EAgreementState } from '../types/EAgreementState'
import { ECustomContractError } from '../types/ECustomContractError'
import { compareAgreements, nowTimestamp, stringToHex } from './utils/helpers'

describe('MarrySign', () => {
  let contract: MarrySign
  let owner: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  const terminationCost = ethers.utils.parseEther('0.001')
  const serviceFee = ethers.utils.parseEther('0.00001')

  beforeEach(async () => {
    const results = await loadFixture(deployContracts)

    contract = results.contract
    owner = results.owner
    alice = results.alice
    bob = results.bob

    return results
  })

  const _getFee = async () => {
    return await contract.connect(owner).getFee()
  }
  const _setFee = async (fee: BigNumber) => {
    return await contract.connect(owner).setFee(fee)
  }

  const _createAgreement = async (
    contract: MarrySign,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    serviceFee: BigNumber = BigNumber.from('0')
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

    let capturedId: BytesLike = ethers.utils.hexZeroPad(
      ethers.utils.hexlify(0),
      32
    )
    const captureId = (id: BytesLike) => {
      capturedId = id
      return true
    }

    await _setFee(serviceFee)

    await expect(
      contract
        .connect(alice)
        .createAgreement(bob.address, content, terminationCost, createdAt, {
          value: serviceFee,
        })
    )
      .to.emit(contract, EAgreementEventName.AgreementCreated)
      .withArgs(captureId)
      .to.changeEtherBalances([alice, owner], [-serviceFee, serviceFee])

    const agreement = await contract.callStatic.getAgreement(capturedId)
    expect(agreement.alice).to.be.equal(alice.address)
    expect(agreement.bob).to.be.equal(bob.address)
    expect(agreement.state).to.be.equal(EAgreementState.Created)
    expect(agreement.updatedAt).to.be.equal(createdAt)
    expect(agreement.terminationCost).to.be.equal(terminationCost)
    expect(agreement.content).to.be.equal(content)

    return agreement
  }

  describe('Contract: Fee', () => {
    it('Should revert if called by not the owner', async () => {
      await expect(
        contract.connect(alice).setFee(serviceFee)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.CallerIsNotOwner
      )
    })

    it('Should set the correct fee', async () => {
      await _setFee(serviceFee)

      const actualFee = await _getFee()

      expect(serviceFee.eq(actualFee)).to.be.true
    })
  })

  describe('Agreement: Getters', () => {
    it('Should revert if the passed ID does not exist', async () => {
      const nonExistentId = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

      await expect(
        contract.getAgreement(nonExistentId)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AgreementNotFound
      )
    })

    it("Should return the active agreement by Alice's address", async () => {
      const { id } = await _createAgreement(contract, alice, bob)

      const agreement = await contract.callStatic.getAgreementByAddress(
        alice.address
      )
      expect(id).to.be.equal(agreement.id)
      expect(agreement.alice).to.be.equal(alice.address)
      expect(agreement.bob).to.be.equal(bob.address)
      expect(agreement.state).to.be.equal(EAgreementState.Created)
    })

    it("Should return the active agreement by Bob's address", async () => {
      const { id } = await _createAgreement(contract, alice, bob)

      const agreement = await contract.callStatic.getAgreementByAddress(
        bob.address
      )
      expect(id).to.be.equal(agreement.id)
      expect(agreement.alice).to.be.equal(alice.address)
      expect(agreement.bob).to.be.equal(bob.address)
      expect(agreement.state).to.be.equal(EAgreementState.Created)
    })

    it('Should return all accepted agreements', async () => {
      const { id: id1 } = await _createAgreement(contract, alice, bob)
      await contract.connect(bob).acceptAgreement(id1, nowTimestamp())

      // Creates an agreement in Created state which should be omitted from results.
      await _createAgreement(contract, alice, bob)

      const { id: id3 } = await _createAgreement(contract, alice, bob)
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
      const { id } = await _createAgreement(contract, alice, bob)

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
      let terminationCost: BigNumber = ethers.utils.parseEther('0.05')
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
      terminationCost = ethers.utils.parseEther('0.05')
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
      terminationCost = BigNumber.from('0')
      createdAt = nowTimestamp()

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.ZeroTerminationCost
      )

      // If the amaunt sent is not the same as our fee.

      content = stringToHex('Test vow')
      terminationCost = ethers.utils.parseEther('0.05')
      createdAt = nowTimestamp()

      await expect(
        contract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt, {
            value: serviceFee.sub(ethers.utils.parseEther('0.000001')), // something not equivalent to our serviceFee.
          })
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.MustPayExactFee
      )
    })

    it('Should create an agreement and emit event for correct parameters', async () => {
      await _createAgreement(contract, alice, bob)

      const count = await contract.callStatic.getAgreementCount()
      expect(count).to.be.equal(1)
    })

    it('Should create an agreement and pay our fee', async () => {
      await _createAgreement(contract, alice, bob, serviceFee)

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
      const { id } = await _createAgreement(contract, alice, bob)

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

    it('Should revert if the sent amount is not the same as our fee', async () => {
      const { id } = await _createAgreement(contract, alice, bob)

      await _setFee(serviceFee)

      const acceptedAt = nowTimestamp()
      await expect(
        contract.connect(bob).acceptAgreement(id, acceptedAt, {
          value: serviceFee.sub(ethers.utils.parseEther('0.000001')), // something not equivalent to our serviceFee.
        })
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.MustPayExactFee
      )
    })

    it('Bob should accept an agreement', async () => {
      const { id } = await _createAgreement(contract, alice, bob)

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
      const { id } = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(owner).refuseAgreement(id, nowTimestamp())
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AccessDenied
      )
    })

    it('Bob should be able to refuse their agreement', async () => {
      const { id } = await _createAgreement(contract, alice, bob)

      const refusedAt = nowTimestamp()
      await expect(contract.connect(bob).refuseAgreement(id, refusedAt))
        .to.emit(contract, EAgreementEventName.AgreementRefused)
        .withArgs(id)

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Refused)
      expect(agreement.updatedAt).to.be.equal(refusedAt)
    })

    it('Alice should be able to refuse their agreement', async () => {
      const { id } = await _createAgreement(contract, alice, bob)

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
      const { id } = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(owner).terminateAgreement(id)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.AccessDenied
      )
    })

    it('Should revert if no funds are send', async () => {
      const { id } = await _createAgreement(contract, alice, bob)

      await expect(
        contract.connect(bob).terminateAgreement(id)
      ).to.be.revertedWithCustomError(
        contract,
        ECustomContractError.MustPayExactTerminationCost
      )
    })

    it('Bob should be able to terminate an agreement', async () => {
      const { id, terminationCost } = await _createAgreement(
        contract,
        alice,
        bob
      )

      await expect(
        contract.connect(bob).terminateAgreement(id, {
          value: terminationCost,
        })
      )
        .to.emit(contract, EAgreementEventName.AgreementTerminated)
        .withArgs(id)
        .to.changeEtherBalances(
          [bob, alice],
          [-terminationCost, terminationCost]
        )

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Terminated)
    })

    it('Alice should be able to terminate an agreement', async () => {
      const { id, terminationCost } = await _createAgreement(
        contract,
        alice,
        bob
      )

      await expect(
        contract.connect(alice).terminateAgreement(id, {
          value: terminationCost,
        })
      )
        .to.emit(contract, EAgreementEventName.AgreementTerminated)
        .withArgs(id)
        .to.changeEtherBalances(
          [alice, bob],
          [-terminationCost, terminationCost]
        )

      const agreement = await contract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Terminated)
    })
  })

  describe('Agreement: Lists of Accepted Agreements', () => {
    it('Should return only accepted agreements', async () => {
      await _createAgreement(contract, alice, bob)
      const { id: id2 } = await _createAgreement(contract, alice, bob)
      await _createAgreement(contract, alice, bob)

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

  describe('Agreement: Lists of Accepted Agreements', () => {
    it('Should return empty array if there are no agreements', async () => {
      const page1 = await contract.getPaginatedAgreements(1, 2)

      expect(page1.length).to.be.equal(0)
    })

    it('Should return empty array if page number is out of bounds', async () => {
      await _createAgreement(contract, alice, bob)

      let page = await contract.getPaginatedAgreements(0, 2)
      expect(page.length).to.be.equal(0)

      page = await contract.getPaginatedAgreements(10, 2)
      expect(page.length).to.be.equal(0)
    })

    it('Should return empty array if number of results per page is 0', async () => {
      await _createAgreement(contract, alice, bob)

      let page = await contract.getPaginatedAgreements(1, 0)
      expect(page.length).to.be.equal(0)
    })

    it('Should return correct result if the requested page is not full', async () => {
      const agreement = await _createAgreement(contract, alice, bob)

      const page = await contract.getPaginatedAgreements(1, 2)
      expect(page.length).to.be.equal(2)
      expect(compareAgreements(page[0], agreement)).to.be.true
      expect(page[1].id).to.be.equal(
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
    })

    it('Should return all agreements paginated', async () => {
      const agreement11 = await _createAgreement(contract, alice, bob)
      const agreement12 = await _createAgreement(contract, alice, bob)
      const agreement21 = await _createAgreement(contract, alice, bob)

      const timestamp = nowTimestamp()
      await contract.connect(alice).refuseAgreement(agreement21.id, timestamp)

      const agreement22 = await _createAgreement(contract, alice, bob)
      const agreement31 = await _createAgreement(contract, alice, bob)
      const agreement32 = await _createAgreement(contract, alice, bob)

      const pageSize = 2

      const page1 = await contract.getPaginatedAgreements(1, pageSize)
      expect(page1.length).to.be.equal(2)
      expect(compareAgreements(page1[0], agreement11)).to.be.true
      expect(compareAgreements(page1[1], agreement12)).to.be.true

      const page2 = await contract.getPaginatedAgreements(2, pageSize)
      expect(page2.length).to.be.equal(2)
      expect(
        compareAgreements(page2[0], {
          ...agreement21,
          state: EAgreementState.Refused,
          updatedAt: BigNumber.from(timestamp),
        })
      ).to.be.true
      expect(compareAgreements(page2[1], agreement22)).to.be.true

      const page3 = await contract.getPaginatedAgreements(3, pageSize)
      expect(page3.length).to.be.equal(2)
      expect(compareAgreements(page3[0], agreement31)).to.be.true
      expect(compareAgreements(page3[1], agreement32)).to.be.true
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
