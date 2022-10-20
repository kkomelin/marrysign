// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * @title MarrySign allows a couple to give their marital vows to each other digitally.
 */
contract MarrySign {
  uint8 private constant SERVICE_FEE_PERCENT = 10;

  address payable private owner;

  enum AgreementState {
    Created,
    Accepted
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
   * @param index {unit} The newly-created agreement index.
   */
  event AgreementCreated(uint256 index);
  /**
   * @notice Is emitted when the agreement is accepted by the second party (Bob).
   * @param index {unit} The accepted agreement index.
   */
  event AgreementAccepted(uint256 index);

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
   * @param createdAt {uint256} The creation date in seconds from the Unix epoch.
   */
  function createAgreement(
    address bob,
    bytes memory content,
    uint256 terminationCost,
    uint256 createdAt
  ) public validTimestamp(createdAt) {
    // @todo: Validate the createdAt timestamp.
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
   * @param acceptedAt {uint256} The acceptance date in seconds from the Unix epoch.
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
