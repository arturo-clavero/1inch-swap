// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IL1GatewayRouter.sol";
import "./interfaces/IFusionOrder.sol";

//deployed on ethereum!
contract EthereumRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error tokenNotMapped();
    error DoubleOrder();
    //errors added
    error InvalidSignature();
    error OrderExpired();
    error InsufficientBalance();
    error InsufficientAllowance();

    event BridgeStarted(uint256 indexed orderId);
    event BridgeFinished(uint256 indexed orderId);
    event OrderCreated(uint256 indexed orderId, address indexed maker); //still have to implement createOrder()

    uint256 constant _stateFinished = 0;
    uint256 constant _stateVerified = 1;
    uint256 constant _statePending = 2;
    uint256 constant _stateCancelled = 3;

    mapping(uint256 => uint256) private orders;
    mapping(uint256 => IFusionOrder.Order) private orderDetails; // added

    function verifyOrder(IFusionOrder.Order memory order) private view returns (bool) { //added
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
        return true;
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
                order.minReturnAmount,
                order.sourceChainId,
                order.destinationChainId,
                order.expirationTimestamp
            )
        );
        
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

    function updateOrder(uint256 orderId, uint256 state) private {
        orders[orderId] = state;
    }

    //bridgeStart() to implement with the new order struct (using orderId)
    function bridgeStart(uint256 amount, address srcTokenAddress, uint256 orderId) external payable nonReentrant {
        address l1GatewayRouterAddress = 0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6;

        if (orders[orderId] != 0) {
            revert DoubleOrder();
        }

        //receive tokens
        IERC20(srcTokenAddress).transferFrom(msg.sender, address(this), amount);

        //approve token transfer
        IERC20(srcTokenAddress).approve(l1GatewayRouterAddress, amount);

        //get L2 token address
        address dstTokenAddress = IL1GatewayRouter(l1GatewayRouterAddress).getL2ERC20Address(srcTokenAddress);
        if (dstTokenAddress == address(0)) {
            revert tokenNotMapped();
        }

        //send ERC20
        IL1GatewayRouter(l1GatewayRouterAddress).depositERC20{value: msg.value}(
            srcTokenAddress,
            dstTokenAddress,
            amount,
            200_000,
            "0x" // Optional calldata
        );

        //send event notfication
        emit BridgeStarted(orderId);

        updateOrder(orderId, _statePending);
    }
}
