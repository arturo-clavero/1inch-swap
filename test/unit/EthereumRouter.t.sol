// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import "../../src/EthereumRouter.sol";
import "../../src/interfaces/IFusionOrder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint256 supply)
        ERC20(name, symbol)
    {
        _mint(msg.sender, supply);
    }
}

contract EthereumRouterTest is Test {
	function setUp() public{

	}

	function test() public{
		
	}
}

