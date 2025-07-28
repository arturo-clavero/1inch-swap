// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import "../../src/ScrollRouter.sol";
import "../mocks/mockERC20.sol";
import "../mocks/mockL2GatewayRouter.sol";

contract ScrollRouterTest is Test {
    ScrollRouter public router;
    MockERC20 public token;
    MockL2GatewayRouter public gateway;

    address public user = address(0xBEEF);
    address public gatewayAddress = 0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79;
    address public mockL1Token = address(0xC0FFEE);

    uint256 orderId = 1;

    function setUp() public {
        // Deploy mocks
        token = new MockERC20();
        gateway = new MockL2GatewayRouter(mockL1Token);
        router = new ScrollRouter();

        // Label for debugging
        vm.label(address(token), "MockToken");
        vm.label(address(gateway), "MockGateway");

        // Patch the hardcoded address in EthereumRouter
        vm.etch(gatewayAddress, address(gateway).code);

        // Fund user and approve
        token.mint(user, 1000 ether);
        vm.deal(user, 1 ether);

        vm.startPrank(user);
        token.approve(address(router), 1000 ether);

        // Mock getL2ERC20Address to avoid tokenNotMapped()
        vm.mockCall(
            gatewayAddress,
            abi.encodeWithSelector(IL2GatewayRouter.getL1ERC20Address.selector, address(token)),
            abi.encode(mockL1Token)
        );

        // Mock depositERC20 to skip actual bridge call
        vm.mockCall(
            gatewayAddress,
            abi.encodeWithSelector(
                IL2GatewayRouter.withdrawERC20.selector, address(token), mockL1Token, 100 ether, 200_000, bytes("")
            ),
            ""
        );

        vm.stopPrank();
    }

    function testBridgeStartTransferTokens() public {
        vm.startPrank(user);

        router.bridgeStart{value: 0.01 ether}(100 ether, address(token), orderId);

        assertEq(token.balanceOf(address(router)), 100 ether);

        vm.stopPrank();
    }

    function testBridgeStartDoubleOrder() public {
        vm.startPrank(user);

        router.bridgeStart{value: 0.01 ether}(100 ether, address(token), orderId);

        vm.expectRevert();
        router.bridgeStart{value: 0.01 ether}(100 ether, address(token), orderId);

        vm.stopPrank();
    }

    function testBridgeInsufficientTokens() public {
        vm.startPrank(user);

        vm.expectRevert();
        router.bridgeStart{value: 0.01 ether}(2000 ether, address(token), orderId);

        vm.stopPrank();
    }

    function testTokenNotMapped() public {
        MockERC20 badToken = new MockERC20();
        badToken.mint(user, 1 ether);
        badToken.approve(address(router), 1 ether);
        vm.prank(user);
        vm.expectRevert();
        router.bridgeStart{value: 0.01 ether}(1 ether, address(badToken), orderId);
    }
}
