// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title MarrySign allows a couple to give their marital vows to each other digitally.
 */
contract MarrySign {
  uint8 private constant SERVICE_FEE_PERCENT = 10;

  address payable private owner;

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

  // @dev List of all agreements created.
  Agreement[] private agreements;

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
    require(index <= getAgreementCount(), 'Index is out of range');

    return agreements[index];
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
  ) public validTimestamp(createdAt) {
    require(content.length != 0, 'Content cannot be empty');
    require(bob != address(0), "Bob's address is not set");
    require(terminationCost != 0, 'Termination cost is not set');

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
    validTimestamp(acceptedAt)
  {
    require(index < getAgreementCount(), 'Index is out of range');
    require(msg.sender == agreements[index].bob, 'Not allowed');

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
    validTimestamp(refusedAt)
  {
    require(index < getAgreementCount(), 'Index is out of range');
    require(
      agreements[index].bob == msg.sender ||
        agreements[index].alice == msg.sender,
      'Not allowed'
    );

    agreements[index].state = AgreementState.Refused;
    agreements[index].updatedAt = refusedAt;

    emit AgreementRefused(index);
  }

  /*
   * @notice Terminate an agreement by either either Alice or Bob (involves paying compensation and service fee).
   * @param index {uint256} The agreement index.
   */
  function terminateAgreement(uint256 index) public payable {
    require(index < getAgreementCount(), 'Index is out of range');
    require(
      agreements[index].bob == msg.sender ||
        agreements[index].alice == msg.sender,
      'Not allowed'
    );

    // Make sure the requested compensation matches that which is stated in the agreement.
    require(
      msg.value == agreements[index].terminationCost,
      'The terminating party must pay the exact termination cost'
    );

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

    // agreements[index].state = State.Terminated;

    delete agreements[index];

    emit AgreementTerminated(index);
  }

  modifier validTimestamp(uint256 timestamp) {
    require(
      timestamp != 0 &&
        timestamp <= block.timestamp &&
        timestamp >= block.timestamp - 86400,
      'Invalid timestamp'
    );
    _;
  }

  /**
   * @notice Check if the actor is the contract-owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner, 'Caller is not an owner');
    _;
  }
}
