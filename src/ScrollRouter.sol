// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IL2GatewayRouter.sol";
import "./interfaces/IFusionOrder.sol";

//deployed on scroll!
contract ScrollRouter is ReentrancyGuard {
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
    event OrderCreated(uint256 indexed orderId, address indexed maker);

    uint256 constant _stateFinished = 0;
    uint256 constant _stateVerified = 1;
    uint256 constant _statePending = 2;
    uint256 constant _stateCancelled = 3;

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
        bytes calldata signature
    ) external returns (uint256) {
        //Generate order ID (hash of parameters + nonce)
        uint256 orderId = uint256(keccak256(abi.encodePacked(
            msg.sender,
            sourceToken,
            sourceAmount,
            destinationToken,
            block.chainid,
            destinationChainId,
            startReturnAmount, //Starting price of dutch auction
            startTimestamp, //Starting time of dutch auction
            minReturnAmount, //Minimum ending price of dutch auction
            expirationTimestamp,
            block.timestamp
        )));
        if (orders[orderId] != 0) {
            revert DoubleOrder();
        }

    //Create and store order
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

    //Store order
    orderDetails[orderId] = order;
    //Set initial state
    orders[orderId] = _statePending;
    //Emit event
    emit OrderCreated(orderId, msg.sender);

    return orderId;
    }


    function verifyOrder(IFusionOrder.Order memory order) private view returns (bool) {
        //check for order expiration
        if (block.timestamp > order.expirationTimestamp) {
            revert OrderExpired();
        }
        //verify signature
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

    function updateOrder(uint256 orderId, uint256 state) private {
        orders[orderId] = state;
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
    // //dst token address the address recipient ? To revise 
    // //bridgeStart() to implement with the new order struct (using orderId)
    // function bridgeStart(uint256 amount, address srcTokenAddress, uint256 orderId) external payable {
    //     address l2GatewayRouterAddress = 0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79;

    //     //receive tokens
    //     IERC20(srcTokenAddress).transferFrom(msg.sender, address(this), amount);

    //     //approve token transfer
    //     IERC20(srcTokenAddress).approve(l2GatewayRouterAddress, amount);

    //     //get L2 token address
    //     address dstTokenAddress = IL2GatewayRouter(l2GatewayRouterAddress).getL1ERC20Address(srcTokenAddress);
    //     if (dstTokenAddress == address(0)) {
    //         revert tokenNotMapped();
    //     }

    //     //send ERC20
    //     IL2GatewayRouter(l2GatewayRouterAddress).withdrawERC20{value: msg.value}(
    //         srcTokenAddress,
    //         dstTokenAddress,
    //         amount,
    //         200_000,
    //         "0x" // Optional calldata
    //     );

    //     //send event notfication
    //     emit BridgeStarted(orderId);
    // }
// }
