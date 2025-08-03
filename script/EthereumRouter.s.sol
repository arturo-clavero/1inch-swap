// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EthereumRouter} from "../src/EthereumRouter.sol";
import {MockLayerZeroEndpoint} from "../src/mocks/MockLayerEndpoint.sol";

import "forge-std/console.sol";

contract EthereumRouterScript is Script {
    EthereumRouter public ethereumRouter;
    MockLayerZeroEndpoint public ethereumMockEndpoint;

    function setUp() public {
        vm.startBroadcast();

        ethereumMockEndpoint = new MockLayerZeroEndpoint(31337);
        console.log("ADDRESS MOCKENDPOINT:");
        console.log(address(ethereumMockEndpoint));

        vm.stopBroadcast();
    }

    function run() public {
        vm.startBroadcast();

        ethereumRouter = new EthereumRouter(address(ethereumMockEndpoint));

        console.log("ADDRESS ROUTER:");
        console.log(address(ethereumRouter));

        vm.stopBroadcast();
    }

    function setDestination(address dest) external {
        vm.startBroadcast();
        ethereumRouter.setDestinationContract(dest);
        vm.stopBroadcast();

        console.log("Destination set:", dest);
    }
}
