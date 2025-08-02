// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFusionOrder.sol";

//deployed on ethereum!
contract EthereumRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    //errors added
    error DoubleOrder();
    error InvalidSignature();
    error OrderExpired();
    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidTimestamp();
    error InvalidSignatureLength();

    // events
    event OrderCreated(uint256 indexed orderId);

    address constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

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

        //store order
        orderDetails[orderId] = order;

        emit OrderCreated(orderId);
    }

    function verifyOrder(IFusionOrder.Order memory order) private view {
        //Check for order expiration
        if (block.timestamp > order.expirationTimestamp || order.startTimestamp >= order.expirationTimestamp) {
            revert OrderExpired();
        }
        //Verify signature
        address signer = recoverSigner(order);
        if (signer != order.maker) {
            revert InvalidSignature();
        }
        //check balance (and allowance if ERC20)
        if (order.sourceToken == NATIVE_TOKEN || order.sourceToken == address(0)) {
            if (order.maker.balance < order.sourceAmount) {
                revert InsufficientBalance();
            }
        } else {
            if (IERC20(order.sourceToken).balanceOf(order.maker) < order.sourceAmount) {
                revert InsufficientBalance();
            }
            if (IERC20(order.sourceToken).allowance(order.maker, address(this)) < order.sourceAmount) {
                revert InsufficientAllowance();
            }
        }
    }

    function recoverSigner(IFusionOrder.Order memory order) private pure returns (address) {
        // Create message hash from order parameters
        bytes32 messageHash = keccak256(abi.encodePacked(order.orderId));

        // Convert to Ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Extract r, s, v from signature
        bytes memory signature = order.signature;
        if (signature.length != 65) {
            revert InvalidSignatureLength();
        }

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
