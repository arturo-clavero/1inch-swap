// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFusionOrder.sol";

//deployed on ethereum!
contract EthereumRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error DoubleOrder();
    //errors added
    error InvalidSignature();
    error OrderExpired();
    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidTimestamp();

    event OrderCreated(uint256 indexed orderId, address indexed maker);

    mapping(uint256 => uint256) private orders;
    mapping(uint256 => IFusionOrder.Order) private orderDetails; // added

    function createOrder(
        address sourceToken,
        uint256 sourceAmount,
        address destinationToken,
        uint32 destinationChainId,
        uint256 startReturnAmount,
        uint256 startTimestamp,
        uint256 minReturnAmount,
        uint256 expirationTimestamp,
        bytes calldata signature,
		uint256 orderId
    ) external {

        if (orderDetails[orderId].maker != address(0)) {
            revert DoubleOrder();
        }
		
		IFusionOrder.Order memory order = IFusionOrder.Order({
			orderId: orderId,
			maker: msg.sender,
			sourceToken: sourceToken,
			sourceAmount: sourceAmount,
			destinationToken: destinationToken,
			sourceChainId: uint32(block.chainid),
			destinationChainId: destinationChainId,
			startReturnAmount: startReturnAmount,
			startTimestamp: startTimestamp,
			minReturnAmount: minReturnAmount,
			expirationTimestamp: expirationTimestamp,
			signature: signature
		});

		verifyOrder(order);

		//store order
		orderDetails[orderId] = order;

		emit OrderCreated(orderId, msg.sender);

	}

    function verifyOrder(IFusionOrder.Order memory order) private view { //added
        //Check for order expiration
        if (block.timestamp > order.expirationTimestamp) {
            revert OrderExpired();
        }
        //Verify signature
        address signer = recoverSigner(order);
        if (signer != order.maker) {
            revert InvalidSignature();
        }
        //check balance
        if (IERC20(order.sourceToken).balanceOf(order.maker) < order.sourceAmount) {
            revert InsufficientBalance();
        }
        //check allowance
        if (IERC20(order.sourceToken).allowance(order.maker, address(this)) < order.sourceAmount) {
            revert InsufficientAllowance();
        }
        //check for timestamp
        if (order.startTimestamp >= order.expirationTimestamp) {
            revert OrderExpired();
        }
    }

    function recoverSigner(IFusionOrder.Order memory order) private pure returns (address) { //added
        // Create message hash from order parameters
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                order.orderId,
                order.maker,
                order.sourceToken,
                order.sourceAmount,
                order.destinationToken,
                order.sourceChainId,
                order.destinationChainId,
                order.startReturnAmount,
                order.startTimestamp,
                order.minReturnAmount,
                order.expirationTimestamp
            )
        ); //In front end we need to pass the parameters in this exact order
        
        // Convert to Ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        // Extract r, s, v from signature
        bytes memory signature = order.signature;
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Adjust v if needed (for some wallets)
        if (v < 27) {
            v += 27;
        }
        
        // Recover and return signer address
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    //Dutch auction implementation
    function getCurrentReturnAmount(uint256 orderId) public view returns (uint256) {
        IFusionOrder.Order memory order = orderDetails[orderId];
        
        // If auction hasn't started yet
        if (block.timestamp < order.startTimestamp) {
            return order.startReturnAmount;
        }
        
        // If auction has ended
        if (block.timestamp >= order.expirationTimestamp) {
            return order.minReturnAmount;
        }
        
        // Calculate current return amount based on elapsed time
        uint256 elapsed = block.timestamp - order.startTimestamp;
        uint256 totalDuration = order.expirationTimestamp - order.startTimestamp;
        uint256 amountRange = order.startReturnAmount - order.minReturnAmount;
        uint256 reduction = (amountRange * elapsed) / totalDuration;
        
        return order.startReturnAmount - reduction;
    }
}
