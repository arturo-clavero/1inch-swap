// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFusionOrder.sol";
import "./interfaces/ILayerZeroEndpoint.sol";
import "./interfaces/LayerZeroReceiver.sol";

contract EthereumRouter is ReentrancyGuard, LayerZeroReceiver {
    using SafeERC20 for IERC20;

    // Constants
    address constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // Errors
    error DoubleOrder();
    error InvalidSignature();
    error OrderExpired();
    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidTimestamp();
    error InvalidSignatureLength();
    error OrderAlreadyFilled();
    error InvalidRequestedAmount();

    // Events
    event OrderCreated(bytes32 indexed orderId);
    event OrderRefill(bytes32 indexed orderId, uint256 filledAmount);
    event LockedEscrow(address indexed sender, uint256 amount, address indexed receiver);
    event ReceiveMsg(uint16 srcChainId, address from, uint16 messageCount, bytes payload);

    mapping(uint256 => IFusionOrder.Order) private orderDetails;

    ILayerZeroEndpoint public endpoint;
    bytes public destinationAddress; // packed bytes of destination contract on dst chain
    uint16 public messageCount;

    constructor(address _endpoint) {
        endpoint = ILayerZeroEndpoint(_endpoint);
    }

    modifier existingOrder(uint256 orderId) {
        require(orderDetails[orderId].maker != address(0), "Order deoesn't exist");
        _;
    }

    modifier nonExpiredOrder(uint256 orderId) {
        IFusionOrder.Order memory order = orderDetails[orderId];
        require(
            block.timestamp <= order.expirationTimestamp && order.startTimestamp < order.expirationTimestamp,
            "Order expired or invalid timestamps"
        );
        _;
    }

    function createOrder(
        address sourceToken,
        uint256 sourceAmount,
        address destinationToken,
        uint32 destinationChainId,
        uint256 startReturnAmount,
        uint256 minReturnAmount,
        uint256 minRefill,
        uint256 startTimestamp,
        uint256 expirationTimestamp,
        bytes calldata signature,
        bytes calldata secretHash,
        uint256 orderId
    ) external payable nonReentrant {
        // if (orderDetails[orderId].maker != address(0))
        // 	revert DoubleOrder();
       require(orderDetails[orderId].maker == address(0), "DoubleOrder: order already exists");

        IFusionOrder.Order memory order = IFusionOrder.Order({
            orderId: orderId,
            maker: msg.sender,
            sourceToken: sourceToken,
            initialSourceAmount: sourceAmount,
            currentSourceAmount: sourceAmount,
            destinationToken: destinationToken,
            sourceChainId: uint32(block.chainid),
            destinationChainId: destinationChainId,
            startReturnAmount: startReturnAmount,
            minReturnAmount: minReturnAmount,
            minRefill: minRefill,
            startTimestamp: startTimestamp,
            expirationTimestamp: expirationTimestamp,
            signature: signature,
            secretHash: secretHash,
            alreadyFilled: false
        });

        orderDetails[orderId] = order;

        //verifyOrder(order);

        emit OrderCreated(bytes32(orderId));
    }

    function verifyOrder(IFusionOrder.Order memory order) private view {
        //order expired
        // if (block.timestamp > order.expirationTimestamp || order.startTimestamp > order.expirationTimestamp) {
        //     revert OrderExpired();
        // }
        require(block.timestamp <= order.expirationTimestamp, "OrderExpired: expired");
        require(order.startTimestamp <= order.expirationTimestamp, "OrderExpired: invalid timestamps");

        //signature
        bytes32 messageHash = keccak256(abi.encodePacked(order.orderId));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        bytes memory signature = order.signature;
        // if (signature.length != 65) {
        //     revert InvalidSignatureLength();
        // }
        require(order.signature.length == 65, "InvalidSignatureLength");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        if (signer != order.maker) {
            revert InvalidSignature();
        }
        require(signer == order.maker, "InvalidSignature: signer mismatch");

        // //check deposit or check allowance for MAKER
        // // if (order.sourceToken == NATIVE_TOKEN || order.sourceToken == address(0)) {
        // //     if (msg.value < order.initialSourceAmount) {
        // //         revert InsufficientBalance();
        // //     }
        // // } else {
        // //     if (IERC20(order.destinationToken).balanceOf(order.maker) < order.initialSourceAmount) {
        // //         revert InsufficientBalance();
        // //     }
        // //     if (IERC20(order.destinationToken).allowance(order.maker, address(this)) < order.initialSourceAmount) {
        // //         revert InsufficientAllowance();
        // //     }
        // // }
        if (order.sourceToken == NATIVE_TOKEN || order.sourceToken == address(0)) {
            require(msg.value >= order.initialSourceAmount, "InsufficientBalance: not enough ETH sent");
        } 
		else {
            require(
                IERC20(order.destinationToken).balanceOf(order.maker) >= order.initialSourceAmount,
                "InsufficientBalance: token balance too low"
            );
            require(
                IERC20(order.destinationToken).allowance(order.maker, address(this)) >= order.initialSourceAmount,
                "InsufficientAllowance"
            );
        }
    }

    function getCurrentReturnAmount(uint256 orderId) public view returns (uint256) {
        IFusionOrder.Order memory order = orderDetails[orderId];

        if (block.timestamp < order.startTimestamp) return order.startReturnAmount;
        if (block.timestamp >= order.expirationTimestamp) return order.minReturnAmount;

        uint256 elapsed = block.timestamp - order.startTimestamp;
        uint256 totalDuration = order.expirationTimestamp - order.startTimestamp;
        uint256 amountRange = order.startReturnAmount - order.minReturnAmount;
        uint256 reduction = (amountRange * elapsed) / totalDuration;

        return order.startReturnAmount - reduction;
    }

    function fillOrder(uint256 orderId, bool isFillFull, uint256 refillAmount)
        external
        payable
        existingOrder(orderId)
        nonExpiredOrder(orderId)
        nonReentrant
    {
        IFusionOrder.Order storage order = orderDetails[orderId];

        //basic requirements:
        require(order.currentSourceAmount > 0, "order already filled");
        //if (order.alreadyFilled) revert OrderAlreadyFilled();
        require(isFillFull == true || (refillAmount >= order.minRefill), "invaild requested fill");
        // if (!isFull && requestedAmount < order.minRefill) revert InvalidRequestedAmount();

        // get amount to be paid by taker
        uint256 totalAmount = getCurrentReturnAmount(orderId);
        uint256 takerAmount;
        uint256 makerAmount;
        if (isFillFull == true || refillAmount > totalAmount) {
            takerAmount = totalAmount;
            makerAmount = order.currentSourceAmount;
        } else {
            takerAmount = refillAmount;
            makerAmount = order.initialSourceAmount * (refillAmount / totalAmount);
        }

        // Check TAKER'S balance and allowance for destinationToken
        if (order.destinationToken != NATIVE_TOKEN) {
            require(IERC20(order.destinationToken).balanceOf(msg.sender) >= takerAmount, "insufficeint balance");
            // if (IERC20(order.destinationToken).balanceOf(msg.sender) < takerAmount) {
            // 	revert InsufficientBalance();
            // }
            require(
                IERC20(order.destinationToken).allowance(msg.sender, address(this)) < takerAmount,
                "insufficeint balance"
            );

            // if (IERC20(order.destinationToken).allowance(msg.sender, address(this)) < takerAmount) {
            // 	revert InsufficientAllowance();
            // }
        } else {
            require(msg.value >= takerAmount, "not enough native balance");
            // if (msg.value < totalAmount)
            // 	revert InsufficientBalance();
        }

        // Update order amounts
        order.currentSourceAmount -= makerAmount;
        if (order.currentSourceAmount > 0) {
            emit OrderRefill(bytes32(orderId), takerAmount);
        }

        emit LockedEscrow(msg.sender, takerAmount, order.maker);

        // Lock takers tokens in dst:
        // we need to transfer the takers money, do we transfer to the sendmsg? or transfer after arriving for cheaper?
        // bytes memory payload = abi.encode(orderId, takerAmount, order.maker, msg.sender);
        // sendMsg(order.destinationChainId, destinationAddress, payload);

        // Lock makers tokens in src:
        //call another smartcontract.deposit(){value: order.sourceAmount};
    }

    function setDestinationContract(address destination) external {
        destinationAddress = abi.encodePacked(destination);
    }

    function sendMsg(uint32 _dstChainId, bytes memory _destination, bytes memory _payload) private {
        endpoint.send{value: msg.value}(
            _dstChainId, _destination, _payload, payable(msg.sender), address(this), bytes("")
        );
    }

    // LayerZero receive function
    function lzReceive(uint16 _srcChainId, bytes memory _from, uint64 _nonce, bytes memory _payload)
        external
        override
    {
        require(msg.sender == address(endpoint), "Caller not endpoint");

        (uint256 orderId, uint256 takerAmount, address maker, address taker) =
            abi.decode(_payload, (uint256, uint256, address, address));

        // TODO: Call escrow contract or release funds on destination chain
        // e.g., escrowContract.releaseFunds(orderId, takerAmount, taker);
        emit LockedEscrow(taker, takerAmount, maker);

        emit ReceiveMsg(_srcChainId, taker, messageCount++, _payload);
    }
}
