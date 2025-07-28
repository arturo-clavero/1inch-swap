// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IL2GatewayRouter {
    function withdrawERC20(address _token, address _to, uint256 _amount, uint256 _gasLimit, bytes calldata _data)
        external
        payable;

    function getL1ERC20Address(address _l2Token) external view returns (address);
}
