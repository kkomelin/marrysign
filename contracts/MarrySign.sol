// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MarrySign {
    string private message;

    event MessageChanged(string message);

    constructor(string memory _message) {
       message = _message;
    }

    function getMessage() public view returns (string memory) {
        require(bytes(message).length > 0, "Message is empty");

        return message;
    }
}
