// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EthereumRouter} from "../src/EthereumRouter.sol";
import "forge-std/console.sol";

contract EthereumRouterScript is Script {
    EthereumRouter public ethereumRouter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        ethereumRouter = new EthereumRouter();
		
		console.log("ADDRESS:");
		console.log(address(ethereumRouter));

        vm.stopBroadcast();
    }
}
