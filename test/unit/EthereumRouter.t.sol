// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import "../../src/EthereumRouter.sol";
import "../mocks/mockERC20.sol";
import "../mocks/mockL1GatewayRouter.sol";
import "../../src/interfaces/IFusionOrder.sol";

contract EthereumRouterTest is Test {
    EthereumRouter public router;
    MockERC20 public sourceToken;
    MockERC20 public destinationToken;
    MockL1GatewayRouter public gateway;

    address public user = address(0xBEEF);
    address public gatewayAddress = 0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6;
    address public mockL2Token = address(0xC0FFEE);

    // Test parameters for order creation
    uint256 sourceAmount = 100 ether;
    uint32 destinationChainId = 534352; // Scroll chainId
    uint256 startReturnAmount = 98 ether;
    uint256 minReturnAmount = 95 ether;
    uint256 expirationTimestamp;
    uint256 startTimestamp;
    bytes signature;

    // Private key for signing orders (for testing only)
    uint256 private constant PRIVATE_KEY = 0xA11CE;

    function setUp() public {
        // Deploy contracts
        sourceToken = new MockERC20();
        destinationToken = new MockERC20();
        gateway = new MockL1GatewayRouter(mockL2Token);
        router = new EthereumRouter();

        // Label for debugging
        vm.label(address(sourceToken), "SourceToken");
        vm.label(address(destinationToken), "DestinationToken");
        vm.label(address(gateway), "MockGateway");
        vm.label(user, "User");

        // Set timestamps for testing
        startTimestamp = block.timestamp + 1 hours;
        expirationTimestamp = block.timestamp + 25 hours;

        // Fund user and approve
        sourceToken.mint(user, 1000 ether);
        vm.deal(user, 1 ether);

        vm.startPrank(user);
        sourceToken.approve(address(router), 1000 ether);
        vm.stopPrank();

        // Create a valid signature for testing
        signature = createSignature();
    }

    // Helper function to create a valid signature for testing
    function createSignature() internal returns (bytes memory) {
        // Generate a deterministic orderId for signature
        uint256 orderId = uint256(keccak256(abi.encodePacked(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            block.chainid,
            destinationChainId,
            startReturnAmount,
            startTimestamp,
            minReturnAmount,
            expirationTimestamp,
            block.timestamp
        )));

        // Create message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            orderId,
            user,
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            block.chainid,
            destinationChainId,
            startReturnAmount,
            startTimestamp,
            minReturnAmount,
            expirationTimestamp
        ));
        
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Sign the message hash
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PRIVATE_KEY, ethSignedMessageHash);
        
        // Pack signature
        return abi.encodePacked(r, s, v);
    }

    function testCreateOrder() public {
        vm.startPrank(user);
        
        uint256 orderId = router.createOrder(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            destinationChainId,
            startReturnAmount,
            startTimestamp,
            minReturnAmount,
            expirationTimestamp,
            signature
        );
        
        // Verify order was created
        assertGt(orderId, 0, "Order ID should be greater than 0");
        
        vm.stopPrank();
    }

    function testDuplicateOrder() public {
        vm.startPrank(user);
        
        // Create first order
        router.createOrder(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            destinationChainId,
            startReturnAmount,
            startTimestamp,
            minReturnAmount,
            expirationTimestamp,
            signature
        );
        
        // Attempt to create duplicate order - should revert
        vm.expectRevert();
        router.createOrder(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            destinationChainId,
            startReturnAmount,
            startTimestamp,
            minReturnAmount,
            expirationTimestamp,
            signature
        );
        
        vm.stopPrank();
    }

    function testGetCurrentReturnAmount() public {
        vm.startPrank(user);
        
        uint256 orderId = router.createOrder(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            destinationChainId,
            startReturnAmount,
            startTimestamp,
            minReturnAmount,
            expirationTimestamp,
            signature
        );
        
        // Test before auction starts
        assertEq(router.getCurrentReturnAmount(orderId), startReturnAmount, "Return amount should be startReturnAmount before auction starts");
        
        // Test during auction (halfway through)
        uint256 halfwayTime = startTimestamp + (expirationTimestamp - startTimestamp) / 2;
        vm.warp(halfwayTime);
        uint256 expectedHalfway = startReturnAmount - ((startReturnAmount - minReturnAmount) / 2);
        assertEq(router.getCurrentReturnAmount(orderId), expectedHalfway, "Return amount should be halfway between start and min");
        
        // Test after auction ends
        vm.warp(expirationTimestamp + 1);
        assertEq(router.getCurrentReturnAmount(orderId), minReturnAmount, "Return amount should be minReturnAmount after auction ends");
        
        vm.stopPrank();
    }

    function testInvalidTimestamps() public {
        vm.startPrank(user);
        
        // Create order with startTimestamp >= expirationTimestamp (should revert)
        uint256 invalidStartTimestamp = expirationTimestamp;
        
        // Need to create a new signature with the invalid timestamp
        bytes memory invalidSignature = createInvalidSignature(invalidStartTimestamp);
        
        vm.expectRevert();
        router.createOrder(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            destinationChainId,
            startReturnAmount,
            invalidStartTimestamp,
            minReturnAmount,
            expirationTimestamp,
            invalidSignature
        );
        
        vm.stopPrank();
    }

    function createInvalidSignature(uint256 invalidStartTimestamp) internal returns (bytes memory) {
        // Generate a deterministic orderId for signature
        uint256 orderId = uint256(keccak256(abi.encodePacked(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            block.chainid,
            destinationChainId,
            startReturnAmount,
            invalidStartTimestamp,
            minReturnAmount,
            expirationTimestamp,
            block.timestamp
        )));

        // Create message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            orderId,
            user,
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            block.chainid,
            destinationChainId,
            startReturnAmount,
            invalidStartTimestamp,
            minReturnAmount,
            expirationTimestamp
        ));
        
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Sign the message hash
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PRIVATE_KEY, ethSignedMessageHash);
        
        // Pack signature
        return abi.encodePacked(r, s, v);
    }

    function testExpiredOrder() public {
        vm.startPrank(user);
        
        // Set block timestamp to a specific value
        uint256 testTime = 1000000;
        vm.warp(testTime);
        
        // Set up timestamps for an expired order
        uint256 pastStartTimestamp = testTime - 2 hours;
        uint256 pastExpiration = testTime - 1 hours;
        
        // Generate a signature for this order
        bytes memory expiredSignature = generateSignature(
            user,
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            destinationChainId,
            startReturnAmount,
            pastStartTimestamp,
            minReturnAmount,
            pastExpiration
        );
        
        // This should revert with OrderExpired
        vm.expectRevert(EthereumRouter.OrderExpired.selector);
        router.createOrder(
            address(sourceToken),
            sourceAmount,
            address(destinationToken),
            destinationChainId,
            startReturnAmount,
            pastStartTimestamp,
            minReturnAmount,
            pastExpiration,
            expiredSignature
        );
        
        vm.stopPrank();
    }
    
    // Helper function to generate a signature for any order parameters
    function generateSignature(
        address _maker,
        address _sourceToken,
        uint256 _sourceAmount,
        address _destinationToken,
        uint32 _destinationChainId,
        uint256 _startReturnAmount,
        uint256 _startTimestamp,
        uint256 _minReturnAmount,
        uint256 _expirationTimestamp
    ) internal returns (bytes memory) {
        // Generate a deterministic orderId for signature
        uint256 orderId = uint256(keccak256(abi.encodePacked(
            _sourceToken,
            _sourceAmount,
            _destinationToken,
            block.chainid,
            _destinationChainId,
            _startReturnAmount,
            _startTimestamp,
            _minReturnAmount,
            _expirationTimestamp,
            block.timestamp
        )));

        // Create message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            orderId,
            _maker,
            _sourceToken,
            _sourceAmount,
            _destinationToken,
            block.chainid,
            _destinationChainId,
            _startReturnAmount,
            _startTimestamp,
            _minReturnAmount,
            _expirationTimestamp
        ));
        
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Sign the message hash
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PRIVATE_KEY, ethSignedMessageHash);
        
        // Pack signature
        return abi.encodePacked(r, s, v);
    }
}
