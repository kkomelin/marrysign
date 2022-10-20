// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * @title MarrySign allows a couple to give their marital vows to each other digitally.
 */
contract MarrySign {
    string private message;
    address private owner;

    /**
     * @notice Is emitted when the message changes.
     * @param message {string} The new message value.
     */
    event MessageChanged(string message);

    /**
     * @notice Check if the actor is a contract-owner.
     */
    modifier onlyOwner {
        require(msg.sender == owner, 'Caller is not an owner');
        _;
    }

    constructor(string memory _message) {
        message = _message;
        owner = msg.sender;
    }

    /**
     * @notice Get message value.
     * @return {string} Current message value.
     */
    function getMessage() public view returns (string memory) {
        return message;
    }

    /**
     * @notice Set a new message value.
     * @param _message {string} A new message to set.
     */
    function setMessage(string memory _message) public onlyOwner {
        require(bytes(_message).length > 0, "Message cannot be empty");

        message = _message;
        
        emit MessageChanged(_message);
    }
}
