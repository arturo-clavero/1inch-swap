// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/EthereumRouter.sol";
import "./mocks/mockERC20.sol";
import "./mocks/mockL1GatewayRouter.sol";

contract EthereumRouterTest is Test {
    EthereumRouter public router;
    MockERC20 public token;
    MockL1GatewayRouter public gateway;

    address public user = address(0xBEEF);
	event BridgeStarted(uint256 indexed orderId);


    function setUp() public {
        token = new MockERC20();
        gateway = new MockL1GatewayRouter(address(0xC0DE)); // fake L2 token
        router = new EthereumRouter();

        // Label for debug
        vm.label(address(token), "MockToken");
        vm.label(address(gateway), "MockGateway");

        // Store gateway address in correct slot via vm.etch
        vm.etch(0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6, address(gateway).code);

        // Give user tokens and approve router
        token.mint(user, 1000 ether);
        vm.startPrank(user);
        token.approve(address(router), 1000 ether);
        vm.stopPrank();
    }

    function testBridgeStart() public {
        vm.startPrank(user);

        uint256 orderId = 1;
		// vm.expectEmit(true, false, false, true, address(router));
		// emit EthereumRouter.BridgeStarted(orderId);

        router.bridgeStart{value: 0.01 ether}(100 ether, address(token), orderId);

        vm.stopPrank();

        // Assert router has the tokens
        // assertEq(token.balanceOf(address(router)), 100 ether);
    }
}
