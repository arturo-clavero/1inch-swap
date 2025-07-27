// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import "../../src/EthereumRouter.sol";
import "../mocks/mockERC20.sol";
import "../mocks/mockL1GatewayRouter.sol";

contract EthereumRouterTest is Test {
    EthereumRouter public router;
    MockERC20 public token;
    MockL1GatewayRouter public gateway;

    address public user = address(0xBEEF);
    address public gatewayAddress = 0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6;
    address public mockL2Token = address(0xC0FFEE);

    uint256 orderId = 1;

    function setUp() public {
        // Deploy mocks
        token = new MockERC20();
        gateway = new MockL1GatewayRouter(mockL2Token);
        router = new EthereumRouter();

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
            abi.encodeWithSelector(IL1GatewayRouter.getL2ERC20Address.selector, address(token)),
            abi.encode(mockL2Token)
        );

        // Mock depositERC20 to skip actual bridge call
        vm.mockCall(
            gatewayAddress,
            abi.encodeWithSelector(
                IL1GatewayRouter.depositERC20.selector, address(token), mockL2Token, 100 ether, 200_000, bytes("")
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
