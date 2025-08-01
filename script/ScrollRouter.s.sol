// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ScrollRouter} from "../src/ScrollRouter.sol";

contract ScrollRouterScript is Script {
    ScrollRouter public scrollRouter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        scrollRouter = new ScrollRouter();

        vm.stopBroadcast();
    }
}
