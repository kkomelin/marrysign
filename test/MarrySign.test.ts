import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BytesLike } from 'ethers'
import { ethers } from 'hardhat'
import { deployContracts } from '../lib/deploy'
import { MarrySign, MockV3Aggregator } from '../typechain'
import { EAgreementEventName } from '../types/EAgreementEventName'
import { EAgreementState } from '../types/EAgreementState'
import { ECustomContractError } from '../types/ECustomContractError'
import {
  nowTimestamp,
  stringToHex,
  terminationServiceFeeInUsd,
  usdToWei,
} from './utils/helpers'

describe('MarrySign', () => {
  let marrySignContract: MarrySign
  let owner: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let v3AggregatorContract: MockV3Aggregator

  const terminationCostInUSD = 10 // 1000000
  const serviceFeePercent = 10 // Have to hardcode it here for now.

  beforeEach(async () => {
    const results = await loadFixture(deployContracts)

    marrySignContract = results.marrySignContract
    owner = results.owner
    alice = results.alice
    bob = results.bob
    v3AggregatorContract = results.v3AggregatorContract

    return results
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
        .createAgreement(bob.address, content, terminationCostInUSD, createdAt)
    )
      .to.emit(contract, EAgreementEventName.AgreementCreated)
      .withArgs(captureId)

    const agreement = await contract.callStatic.getAgreement(capturedId)
    expect(agreement.alice).to.be.equal(alice.address)
    expect(agreement.bob).to.be.equal(bob.address)
    expect(agreement.state).to.be.equal(EAgreementState.Created)
    expect(agreement.updatedAt).to.be.equal(createdAt)
    expect(agreement.terminationCost).to.be.equal(terminationCostInUSD)
    expect(agreement.content).to.be.equal(content)

    return agreement
  }

  describe('Contract: Deployment', () => {
    it('Should set the aggregator address correctly', async () => {
      const response = await marrySignContract.getPriceFeed()
      expect(response).to.be.equal(v3AggregatorContract.address)
    })
  })

  describe('Agreement: Getters', () => {
    it('Should revert if the passed ID does not exist', async () => {
      const nonExistentId = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

      await expect(
        marrySignContract.getAgreement(nonExistentId)
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.AgreementNotFound
      )
    })

    it("Should return the active agreement by Alice's address", async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      const agreement =
        await marrySignContract.callStatic.getAgreementByAddress(alice.address)
      expect(id).to.be.equal(agreement.id)
      expect(agreement.alice).to.be.equal(alice.address)
      expect(agreement.bob).to.be.equal(bob.address)
      expect(agreement.state).to.be.equal(EAgreementState.Created)
    })

    it("Should return the active agreement by Bob's address", async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      const agreement =
        await marrySignContract.callStatic.getAgreementByAddress(bob.address)
      expect(id).to.be.equal(agreement.id)
      expect(agreement.alice).to.be.equal(alice.address)
      expect(agreement.bob).to.be.equal(bob.address)
      expect(agreement.state).to.be.equal(EAgreementState.Created)
    })

    it('Should return all accepted agreements', async () => {
      const { id: id1 } = await _createAgreement(marrySignContract, alice, bob)
      await marrySignContract.connect(bob).acceptAgreement(id1, nowTimestamp())

      // Creates an agreement in Created state which should be omitted from results.
      await _createAgreement(marrySignContract, alice, bob)

      const { id: id3 } = await _createAgreement(marrySignContract, alice, bob)
      await marrySignContract.connect(bob).acceptAgreement(id3, nowTimestamp())

      const agreements =
        await marrySignContract.callStatic.getAcceptedAgreements()
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
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      await marrySignContract.connect(bob).refuseAgreement(id, nowTimestamp())

      await expect(
        marrySignContract.callStatic.getAgreementByAddress(alice.address)
      ).to.be.revertedWithCustomError(
        marrySignContract,
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
        marrySignContract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.InvalidTimestamp
      )

      content = stringToHex('')
      terminationCost = 100
      createdAt = nowTimestamp()

      await expect(
        marrySignContract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.EmptyContent
      )

      content = stringToHex('Test vow')
      terminationCost = 0
      createdAt = nowTimestamp()

      await expect(
        marrySignContract
          .connect(alice)
          .createAgreement(bob.address, content, terminationCost, createdAt)
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.ZeroTerminationCost
      )
    })

    it('Should create an agreement and emit event for correct parameters', async () => {
      await _createAgreement(marrySignContract, alice, bob)

      const count = await marrySignContract.callStatic.getAgreementCount()
      expect(count).to.be.equal(1)
    })

    it('Should create multiple agreements', async () => {
      const id1 = await _createAgreement(marrySignContract, alice, bob)
      const id2 = await _createAgreement(marrySignContract, alice, bob)

      // Should make sure that the ids are unique.
      expect(id1).to.be.not.equal(id2)

      const count = await marrySignContract.callStatic.getAgreementCount()
      expect(count).to.be.equal(2)
    })
  })

  describe('Agreement: Acceptance', () => {
    it('Should revert if Alice tries to accept an agreement', async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      await expect(
        marrySignContract.connect(alice).acceptAgreement(id, nowTimestamp())
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.AccessDenied
      )
    })

    it('Should revert if the passed ID does not exist', async () => {
      const nonExistentId = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

      await expect(
        marrySignContract
          .connect(bob)
          .acceptAgreement(nonExistentId, nowTimestamp())
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.AgreementNotFound
      )
    })

    it('Bob should accept an agreement', async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      const acceptedAt = nowTimestamp()
      await expect(
        marrySignContract.connect(bob).acceptAgreement(id, acceptedAt)
      )
        .to.emit(marrySignContract, EAgreementEventName.AgreementAccepted)
        .withArgs(id)

      const agreement = await marrySignContract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Accepted)
      expect(agreement.updatedAt).to.be.equal(acceptedAt)
    })
  })

  describe('Agreement: Refusal', () => {
    it('Should revert if the passed ID does not exist', async () => {
      const nonExistentId = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

      await expect(
        marrySignContract
          .connect(alice)
          .refuseAgreement(nonExistentId, nowTimestamp())
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.AgreementNotFound
      )
    })

    it('Should revert if it is refused by neither Alice or Bob', async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      await expect(
        marrySignContract.connect(owner).refuseAgreement(id, nowTimestamp())
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.AccessDenied
      )
    })

    it('Bob should be able to refuse their agreement', async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      const refusedAt = nowTimestamp()
      await expect(
        marrySignContract.connect(bob).refuseAgreement(id, refusedAt)
      )
        .to.emit(marrySignContract, EAgreementEventName.AgreementRefused)
        .withArgs(id)

      const agreement = await marrySignContract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Refused)
      expect(agreement.updatedAt).to.be.equal(refusedAt)
    })

    it('Alice should be able to refuse their agreement', async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      const refusedAt = nowTimestamp()
      await expect(
        marrySignContract.connect(alice).refuseAgreement(id, refusedAt)
      )
        .to.emit(marrySignContract, EAgreementEventName.AgreementRefused)
        .withArgs(id)

      const agreement = await marrySignContract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(2)
      expect(agreement.updatedAt).to.be.equal(refusedAt)
    })
  })

  describe('Agreement: Termination', () => {
    it('Should revert if it is terminated by neither Alice or Bob', async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      await expect(
        marrySignContract.connect(owner).terminateAgreement(id)
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.AccessDenied
      )
    })

    it('Should revert if no funds are send', async () => {
      const { id } = await _createAgreement(marrySignContract, alice, bob)

      await expect(
        marrySignContract.connect(bob).terminateAgreement(id)
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.WrongAmount
      )
    })

    it('Bob should be able to terminate an agreement with penalty', async () => {
      const { id, terminationCost } = await _createAgreement(
        marrySignContract,
        alice,
        bob
      )

      const ethPrice = await v3AggregatorContract.latestAnswer()
      const ethPriceDecimals = await v3AggregatorContract.decimals()

      const serviceFeeInUsd = terminationServiceFeeInUsd(
        Number(terminationCost),
        serviceFeePercent
      )

      const serviceFeeInEth = usdToWei(
        serviceFeeInUsd,
        ethPrice,
        ethPriceDecimals
      )

      const terminationCostInEth = usdToWei(
        Number(terminationCost),
        ethPrice,
        ethPriceDecimals
      )

      await expect(
        marrySignContract.connect(bob).terminateAgreement(id, {
          value: terminationCostInEth,
        })
      )
        .to.emit(marrySignContract, EAgreementEventName.AgreementTerminated)
        .withArgs(id)
        .to.changeEtherBalances(
          [bob, alice, owner],
          [
            -terminationCostInEth,
            terminationCostInEth.sub(serviceFeeInEth),
            serviceFeeInEth,
          ]
        )

      const agreement = await marrySignContract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Terminated)
    })

    it('Alice should be able to terminate an agreement with penalty', async () => {
      const { id, terminationCost } = await _createAgreement(
        marrySignContract,
        alice,
        bob
      )

      const ethPrice = await v3AggregatorContract.latestAnswer()
      const ethPriceDecimals = await v3AggregatorContract.decimals()

      const serviceFeeInUsd = terminationServiceFeeInUsd(
        Number(terminationCost),
        serviceFeePercent
      )

      const serviceFeeInEth = usdToWei(
        serviceFeeInUsd,
        ethPrice,
        ethPriceDecimals
      )

      const terminationCostInEth = usdToWei(
        Number(terminationCost),
        ethPrice,
        ethPriceDecimals
      )

      await expect(
        marrySignContract.connect(alice).terminateAgreement(id, {
          value: terminationCostInEth,
        })
      )
        .to.emit(marrySignContract, EAgreementEventName.AgreementTerminated)
        .withArgs(id)
        .to.changeEtherBalances(
          [alice, bob, owner],
          [
            -terminationCostInEth,
            terminationCostInEth.sub(serviceFeeInEth),
            serviceFeeInEth,
          ]
        )

      const agreement = await marrySignContract.callStatic.getAgreement(id)
      expect(agreement.state).to.be.equal(EAgreementState.Terminated)
    })
  })

  describe('Agreement: List of Accepted', () => {
    it('Should return only accepted agreements', async () => {
      await _createAgreement(marrySignContract, alice, bob)
      const { id: id2 } = await _createAgreement(marrySignContract, alice, bob)
      await _createAgreement(marrySignContract, alice, bob)

      await expect(
        marrySignContract.connect(bob).acceptAgreement(id2, nowTimestamp())
      )
        .to.emit(marrySignContract, EAgreementEventName.AgreementAccepted)
        .withArgs(id2)

      const agreements = await marrySignContract.getAcceptedAgreements()
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
        marrySignContract.connect(alice).withdraw()
      ).to.be.revertedWithCustomError(
        marrySignContract,
        ECustomContractError.CallerIsNotOwner
      )
    })

    it('Should not revert if called by the owner', async () => {
      await expect(marrySignContract.withdraw()).to.changeEtherBalances(
        [owner],
        [0]
      ).not.to.be.reverted
    })
  })
})
