// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FakeEventEmitter {
    event OrderVerified(address indexed sender, string message, uint256 value);

    function triggerTestEvent(string memory message, uint256 value) public {
        emit OrderVerified(msg.sender, message, value);
    }
}

contract FakeRouter {
    event OrderVerified(address indexed sender, string message, uint256 value);
	event Locked(address indexed sender, string message, uint256 value);
	event Unlocked(address indexed sender, string message, uint256 value);
	event Bridged(address indexed sender, string message, uint256 value);

	uint256 public orderId;

    function verifyOrder(uint256 value) public {
		orderId = value;
        emit OrderVerified(msg.sender, "order verified", value);
    }

	function lock() public {
        emit Locked(msg.sender, "order locked", orderId);
    }

	function bridge() public {
        emit Bridged(msg.sender, "order bridged", orderId);
    }

	function unlock() public {
        emit Unlocked(msg.sender, "order unlocked", orderId);
    }

}
