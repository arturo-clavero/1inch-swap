// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IL1GatewayRouter {
    function depositERC20(address _token, address _to, uint256 _amount, uint256 _gasLimit, bytes calldata _data)
        external
        payable;

    function getL2ERC20Address(address _l1Token) external view returns (address);
}
