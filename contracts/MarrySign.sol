// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MarrySign {
    string private message;
    address private owner;

    event MessageChanged(string message);

    modifier onlyOwner {
        require(msg.sender == owner, 'Caller is not an owner');
        _;
    }

    constructor(string memory _message) {
        message = _message;
        owner = msg.sender;
    }

    function getMessage() public view returns (string memory) {
        return message;
    }

    function setMessage(string memory _message) public onlyOwner {
        require(bytes(_message).length > 0, "Message cannot be empty");

        message = _message;
        
        emit MessageChanged(_message);
    }
}
