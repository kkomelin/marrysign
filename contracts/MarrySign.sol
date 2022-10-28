// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

/**
 * @title MarrySign allows a couple to give their marital vows to each other digitally.
 */
contract MarrySign {
  enum AgreementState {
    Created,
    Accepted,
    Refused,
    Terminated
  }

  struct Agreement {
    // @dev The first party of the agreement (agreement starter).
    address alice;
    // @dev The second party fo the agreement (agreement acceptor).
    address bob;
    // @dev Vow text.
    bytes content;
    // @dev A penalty which the one pays for agreement termination.
    uint256 terminationCost;
    // @dev Agreement status.
    AgreementState state;
    // @dev Create/update date in seconds from Unix epoch.
    uint256 updatedAt;
  }

  // @dev Some features are only available to the contract owner, e.g. withdrawal.
  error CallerIsNotOwner();
  // @dev Agreement.content cannot be empty.
  error EmptyContent();
  // @dev We don't allow zero termination cost.
  error ZeroTerminationCost();
  // @dev When Bob is not set.
  error BobNotSpecified();
  // @dev We use it to check Agreement's createdAt, updatedAt, etc. timestamps.
  error InvalidTimestamp();
  // @dev The passed agreement ID/index should be inside the array range.
  error InvalidAgreementId();
  // @dev When the caller is not authorized to call a function.
  error AccessDenied();
  // @dev We should check if the termination cost passed is equivalent to that the agreement creator set.
  error MustPayExactTerminationCost();
  // @dev if there is no an active agreementby given criteria.
  error AgreementNotFound();

  /**
   * @notice Is emitted when a new agreement is created.
   * @param index {unit256} The newly-created agreement index.
   */
  event AgreementCreated(uint256 index);
  /**
   * @notice Is emitted when the agreement is accepted by the second party (Bob).
   * @param index {unit256} The accepted agreement index.
   */
  event AgreementAccepted(uint256 index);
  /**
   * @notice Is emitted when the agreement is refused by any party.
   * @param index {unit256} The refused agreement index.
   */
  event AgreementRefused(uint256 index);
  /**
   * @notice Is emitted when the agreement is terminated by any party.
   * @param index {unit256} The terminated agreement index.
   */
  event AgreementTerminated(uint256 index);

  // @dev We charge this percent of the termination cost for our service.
  uint8 private constant SERVICE_FEE_PERCENT = 10;
  // @dev The contract owner.
  address payable private owner;
  // @dev List of all agreements created.
  Agreement[] private agreements;

  /**
   * @notice Contract constructor.
   */
  constructor() payable {
    owner = payable(msg.sender);
  }

  /**
   * @notice Get the number of all created agreements.
   * @return {uint256}
   */
  function getAgreementCount() public view returns (uint256) {
    return agreements.length;
  }

  /**
   * @notice Get an agreement.
   * @param index {uint256} Agreement array index.
   * @return {Agreement}
   */
  function getAgreement(uint256 index) public view returns (Agreement memory) {
    if (index >= getAgreementCount()) {
      revert InvalidAgreementId();
    }

    return agreements[index];
  }

  /**
   * @notice Get an agreement by an address of one of the partners.
   * @param partnerAddress {address} Partner's address.
   * @return {Agreement}
   */
  function getAgreementByAddress(address partnerAddress)
    public
    view
    returns (Agreement memory)
  {
    for (uint256 i = 0; i < getAgreementCount(); i++) {

      if (
        agreements[i].state != AgreementState.Created &&
        agreements[i].state != AgreementState.Accepted
      ) {
        continue;
      }

      if (agreements[i].alice == partnerAddress || agreements[i].bob == partnerAddress) {
        return agreements[i];
      }
    }

    revert AgreementNotFound();
  }

  /**
   * @notice Get all agreements.
   * @return {Agreement[]}
   */
  function getAgreements() public view returns (Agreement[] memory) {
    return agreements;
  }

  /**
   * @notice Create a new agreement.
   * @param bob {address} The second party's adddress.
   * @param content {bytes} The vow content.
   * @param terminationCost {uint256} The agreement termination cost.
   * @param createdAt {uint256} The creation date in seconds since the Unix epoch.
   */
  function createAgreement(
    address bob,
    bytes memory content,
    uint256 terminationCost,
    uint256 createdAt
  ) public // validTimestamp(createdAt)
  {
    if (content.length == 0) {
      revert EmptyContent();
    }
    if (bob == address(0)) {
      revert BobNotSpecified();
    }
    if (terminationCost == 0) {
      revert ZeroTerminationCost();
    }

    Agreement memory agreement = Agreement(
      msg.sender,
      bob,
      content,
      terminationCost,
      AgreementState.Created,
      createdAt
    );

    agreements.push(agreement);

    emit AgreementCreated(getAgreementCount() - 1);
  }

  /*
   * @notice Accept the agreement by the second party (Bob).
   * @param index {uint256} The agreement index.
   * @param acceptedAt {uint256} The acceptance date in seconds since the Unix epoch.
   */
  function acceptAgreement(uint256 index, uint256 acceptedAt)
    public
  // validTimestamp(acceptedAt)
  {
    if (index >= getAgreementCount()) {
      revert InvalidAgreementId();
    }
    if (msg.sender != agreements[index].bob) {
      revert AccessDenied();
    }

    agreements[index].state = AgreementState.Accepted;
    agreements[index].updatedAt = acceptedAt;

    emit AgreementAccepted(index);
  }

  /*
   * @notice Refuse an agreement by either Alice or Bob.
   * @param index {uint256} The agreement index.
   * @param acceptedAt {uint256} The refusal date in seconds since the Unix epoch.
   */
  function refuseAgreement(uint256 index, uint256 refusedAt)
    public
  // validTimestamp(refusedAt)
  {
    if (index >= getAgreementCount()) {
      revert InvalidAgreementId();
    }
    if (
      agreements[index].bob != msg.sender &&
      agreements[index].alice != msg.sender
    ) {
      revert AccessDenied();
    }

    agreements[index].state = AgreementState.Refused;
    agreements[index].updatedAt = refusedAt;

    emit AgreementRefused(index);
  }

  /*
   * @notice Terminate an agreement by either either Alice or Bob (involves paying compensation and service fee).
   * @param index {uint256} The agreement index.
   */
  function terminateAgreement(uint256 index) public payable {
    if (index >= getAgreementCount()) {
      revert InvalidAgreementId();
    }
    if (
      agreements[index].bob != msg.sender &&
      agreements[index].alice != msg.sender
    ) {
      revert AccessDenied();
    }

    // Make sure the requested compensation matches that which is stated in the agreement.
    if (msg.value != agreements[index].terminationCost) {
      revert MustPayExactTerminationCost();
    }

    // Deduct our service fee.
    uint256 fee = (msg.value * SERVICE_FEE_PERCENT) / 100;
    if (fee != 0) {
      owner.transfer(fee);
    }

    uint256 compensation = msg.value - fee;
    if (agreements[index].alice == msg.sender) {
      // Alice pays Bob the compensation.
      payable(agreements[index].bob).transfer(compensation);
    } else {
      // Bob pays Alice the compensation.
      payable(agreements[index].alice).transfer(compensation);
    }

    // @todo Find a way to destroy the array element completely.
    delete agreements[index];
    // We have to somehow distinguish the terminated agreement from active ones.
    // That's because the array item deletion doesn't factually remove the element from the array.
    agreements[index].state = AgreementState.Terminated;

    emit AgreementTerminated(index);
  }

  /*
   * @notice Transfer contract funds to the contract-owner (withdraw).
   */
  function withdraw() public onlyOwner {
    owner.transfer(address(this).balance);
  }

  /**
   * @notice Check the validity of the timespamp.
   * @param timestamp {uint256} The timestamp being validated.
   */
  modifier validTimestamp(uint256 timestamp) {
    if (
      timestamp == 0 ||
      timestamp > block.timestamp + 15 seconds ||
      timestamp < block.timestamp - 1 days
    ) {
      revert InvalidTimestamp();
    }
    _;
  }

  /**
   * @notice Check whether the caller is the contract-owner.
   */
  modifier onlyOwner() {
    if (msg.sender != owner) {
      revert CallerIsNotOwner();
    }
    _;
  }
}
