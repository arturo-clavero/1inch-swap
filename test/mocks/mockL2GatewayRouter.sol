// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../../src/ScrollRouter.sol";

contract MockL2GatewayRouter is IL2GatewayRouter {
    address public returnedL2Address;

    constructor(address _l2Token) {
        returnedL2Address = _l2Token;
    }

    function getL1ERC20Address(address) external view override returns (address) {
        return returnedL2Address;
    }

    function withdrawERC20(address, address, uint256, uint256, bytes calldata) external payable override {
        // nothing: simulate success
    }
}
