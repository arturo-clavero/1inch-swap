// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.13;

// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "./interfaces/IFusionOrder.sol";
// import "./interfaces/ILayerZeroEndpoint.sol";
// import "./interfaces/LayerZeroReceiver.sol";

// contract ScrollRouter is ReentrancyGuard, LayerZeroReceiver {
//     using SafeERC20 for IERC20;

//     // Constants
//     address constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

//     // Errors
//     error DoubleOrder();
//     error InvalidSignature();
//     error OrderExpired();
//     error InsufficientBalance();
//     error InsufficientAllowance();
//     error InvalidTimestamp();
//     error InvalidSignatureLength();
//     error OrderAlreadyFilled();
//     error InvalidRequestedAmount();

//     // Events
//     event OrderCreated(bytes32 indexed orderId);
//     event OrderRefill(bytes32 indexed orderId, uint256 filledAmount);
//     event LockedEscrow(address indexed sender, uint256 amount, address indexed receiver);
//     event ReceiveMsg(uint16 srcChainId, address from, uint16 messageCount, bytes payload);

//     mapping(uint256 => IFusionOrder.Order) private orderDetails;

//     ILayerZeroEndpoint public endpoint;
//     bytes public destinationAddress; // packed bytes of destination contract on dst chain
//     uint16 public messageCount;

//     constructor(address _endpoint) {
//         endpoint = ILayerZeroEndpoint(_endpoint);
//     }

//     modifier nonExpiredOrder(uint256 orderId) {
//         IFusionOrder.Order memory order = orderDetails[orderId];
//         require(
//             block.timestamp <= order.expirationTimestamp &&
//             order.startTimestamp < order.expirationTimestamp,
//             "Order expired or invalid timestamps"
//         );
//         _;
//     }

//     function createOrder(
//         address sourceToken,
//         uint256 sourceAmount,
//         address destinationToken,
//         uint32 destinationChainId,
//         uint256 startReturnAmount,
//         uint256 startTimestamp,
//         uint256 minReturnAmount,
//         uint256 expirationTimestamp,
//         bytes calldata signature,
//         bytes calldata secretHash,
//         uint256 orderId
//     ) external payable nonReentrant {
//         if (orderDetails[orderId].maker != address(0)) revert DoubleOrder();

//         IFusionOrder.Order memory order = IFusionOrder.Order({
//             orderId: orderId,
//             maker: msg.sender,
//             sourceToken: sourceToken,
//             sourceAmount: sourceAmount,
//             destinationToken: destinationToken,
//             sourceChainId: uint32(block.chainid),
//             destinationChainId: destinationChainId,
//             startReturnAmount: startReturnAmount,
//             startTimestamp: startTimestamp,
//             minReturnAmount: minReturnAmount,
//             expirationTimestamp: expirationTimestamp,
//             signature: signature,
//             secretHash: secretHash,
//             alreadyFilled: false
//         });

//         // TODO:
// 		// verifyOrder(orderId);

//         orderDetails[orderId] = order;
//         emit OrderCreated(bytes32(orderId));
//     }

//     function verifyOrder(uint256 orderId) private view nonExpiredOrder(orderId) {
//         IFusionOrder.Order memory order = orderDetails[orderId];
//         address signer = recoverSigner(orderId);
//         if (signer != order.maker) revert InvalidSignature();

//         if (order.destinationToken == NATIVE_TOKEN || order.destinationToken == address(0)) {
//             // For native tokens: check msg.value handled elsewhere (e.g. lockNativeFunds)
//             // So no check here because native tokens must be sent upfront
//         } else {
//             if (IERC20(order.destinationToken).balanceOf(order.maker) < order.sourceAmount) revert InsufficientBalance();
//             if (IERC20(order.destinationToken).allowance(order.maker, address(this)) < order.sourceAmount) revert InsufficientAllowance();
//         }
//     }

//     function recoverSigner(uint256 orderId) private view returns (address) {
//         IFusionOrder.Order memory order = orderDetails[orderId];
//         bytes32 messageHash = keccak256(abi.encodePacked(order.orderId));
//         bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

//         bytes memory signature = order.signature;
//         if (signature.length != 65) revert InvalidSignatureLength();

//         bytes32 r;
//         bytes32 s;
//         uint8 v;

//         assembly {
//             r := mload(add(signature, 32))
//             s := mload(add(signature, 64))
//             v := byte(0, mload(add(signature, 96)))
//         }
//         if (v < 27) v += 27;
//         return ecrecover(ethSignedMessageHash, v, r, s);
//     }

//     function getCurrentReturnAmount(uint256 orderId) public view returns (uint256) {
//         IFusionOrder.Order memory order = orderDetails[orderId];

//         if (block.timestamp < order.startTimestamp) return order.startReturnAmount;
//         if (block.timestamp >= order.expirationTimestamp) return order.minReturnAmount;

//         uint256 elapsed = block.timestamp - order.startTimestamp;
//         uint256 totalDuration = order.expirationTimestamp - order.startTimestamp;
//         uint256 amountRange = order.startReturnAmount - order.minReturnAmount;
//         uint256 reduction = (amountRange * elapsed) / totalDuration;

//         return order.startReturnAmount - reduction;
//     }

//     // Maker must lock native tokens upfront by sending ETH to this payable function if sourceToken is native
//     function lockNativeFunds(uint256 orderId) external payable {
//         IFusionOrder.Order storage order = orderDetails[orderId];
//         require(msg.sender == order.maker, "Only maker can lock native funds");
//         require(order.sourceToken == NATIVE_TOKEN || order.sourceToken == address(0), "Not native token");
//         require(msg.value == order.sourceAmount, "Incorrect amount sent");
//         // Store native escrow amount here (e.g., mapping (address => mapping(uint256 => uint256)) nativeEscrow;)
//         // For simplicity, assume your contract's balance holds ETH escrow
//         emit LockedEscrow(msg.sender, msg.value, address(this));
//     }

//     function fillOrder(uint256 orderId, bool isFull, uint256 requestedAmount) external payable nonExpiredOrder(orderId) nonReentrant {
//         IFusionOrder.Order storage order = orderDetails[orderId];

//         if (order.alreadyFilled) revert OrderAlreadyFilled();
//         if (!isFull && requestedAmount == 0) revert InvalidRequestedAmount();

//         uint256 totalAmount = getCurrentReturnAmount(orderId);
//         uint256 takerAmount = (isFull || requestedAmount >= totalAmount) ? totalAmount : requestedAmount;

//         // Check taker's balance and allowance for destinationToken
//         if (IERC20(order.destinationToken).balanceOf(msg.sender) < takerAmount) revert InsufficientBalance();
//         if (IERC20(order.destinationToken).allowance(msg.sender, address(this)) < takerAmount) revert InsufficientAllowance();

//         // Lock maker's tokens (native or ERC20)
//         if (order.sourceToken == NATIVE_TOKEN || order.sourceToken == address(0)) {
//             // For native tokens: require that maker previously locked funds via lockNativeFunds
//             // TODO: Check contract balance or bookkeeping if you want to track per order
//             // This example assumes funds are already in the contract
//         } else {
//             // Pull ERC20 tokens from maker
//             IERC20(order.sourceToken).safeTransferFrom(order.maker, address(this), takerAmount);
//         }

//         // Update order amounts
//         if (takerAmount == totalAmount) {
//             order.alreadyFilled = true;
//         } else {
//             order.startReturnAmount -= takerAmount;
//             if (takerAmount > order.minReturnAmount) {
//                 order.minReturnAmount = 0;
//             } else {
//                 order.minReturnAmount -= takerAmount;
//             }
//             emit OrderRefill(bytes32(orderId), takerAmount);
//         }

//         emit LockedEscrow(msg.sender, takerAmount, order.maker);

//         // Prepare cross-chain message payload and send
//         bytes memory payload = abi.encode(orderId, takerAmount, order.maker, msg.sender);
//         sendMsg(order.destinationChainId, destinationAddress, payload);
//     }

//     function sendMsg(uint16 _dstChainId, bytes memory _destination, bytes memory _payload) private payable {
//         endpoint.send{value: msg.value}(
//             _dstChainId,
//             _destination,
//             _payload,
//             payable(msg.sender),
//             address(this),
//             bytes("")
//         );
//     }

//     function setDestinationContract(address destination) external {
//         destinationAddress = abi.encodePacked(destination);
//     }

//     // LayerZero receive function
//     function lzReceive(
//         uint16 _srcChainId,
//         bytes memory _from,
//         uint64 _nonce,
//         bytes memory _payload
//     ) external override {
//         require(msg.sender == address(endpoint), "Caller not endpoint");

//         (uint256 orderId, uint256 takerAmount, address maker, address taker) = abi.decode(_payload, (uint256, uint256, address, address));

//         // TODO: Call escrow contract or release funds on destination chain
//         // e.g., escrowContract.releaseFunds(orderId, takerAmount, taker);
//         emit LockedEscrow(taker, takerAmount, maker);

//         emit ReceiveMsg(_srcChainId, taker, messageCount++, _payload);
//     }
// }
