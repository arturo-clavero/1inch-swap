// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EthereumRouter} from "../src/EthereumRouter.sol";

contract EthereumRouterScript is Script {
    EthereumRouter public ethereumRouter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        ethereumRouter = new EthereumRouter();

        vm.stopBroadcast();
    }
}
