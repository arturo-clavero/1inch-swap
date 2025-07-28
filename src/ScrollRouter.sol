// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IL2GatewayRouter.sol";
import "./interfaces/IFusionOrder.sol";

//deployed on scroll!
contract ScrollRouter {
    error tokenNotMapped();

    event BridgeStarted(uint256 indexed orderId);
    event BridgeFinished(uint256 indexed orderId);

    function verifyOrder() private pure returns (bool) {
        //TODO
        return true;
    }

    //dst token address the address recipient ? To revise
    function bridgeStart(uint256 amount, address srcTokenAddress, uint256 orderId) external payable {
        address l2GatewayRouterAddress = 0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79;

        //receive tokens
        IERC20(srcTokenAddress).transferFrom(msg.sender, address(this), amount);

        //approve token transfer
        IERC20(srcTokenAddress).approve(l2GatewayRouterAddress, amount);

        //get L2 token address
        address dstTokenAddress = IL2GatewayRouter(l2GatewayRouterAddress).getL1ERC20Address(srcTokenAddress);
        if (dstTokenAddress == address(0)) {
            revert tokenNotMapped();
        }

        //send ERC20
        IL2GatewayRouter(l2GatewayRouterAddress).withdrawERC20{value: msg.value}(
            srcTokenAddress,
            dstTokenAddress,
            amount,
            200_000,
            "0x" // Optional calldata
        );

        //send event notfication
        emit BridgeStarted(orderId);
    }
}
