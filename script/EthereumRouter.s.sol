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


//forge script MyDeployScript\
//   --rpc-url http://127.0.0.1:8545 \
//   --broadcast \
//   --account anvilWallet \
//   --sender 0xf39f...266