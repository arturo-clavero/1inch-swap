// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../../src/EthereumRouter.sol";

contract MockL1GatewayRouter is IL1GatewayRouter {
    address public returnedL2Address;

    constructor(address _l2Token) {
        returnedL2Address = _l2Token;
    }

    function getL2ERC20Address(address) external view override returns (address) {
        return returnedL2Address;
    }

    function depositERC20(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external payable override {
        // nothing: simulate success
    }
}
