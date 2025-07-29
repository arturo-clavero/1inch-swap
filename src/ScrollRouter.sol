// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IL2GatewayRouter.sol";

//deployed on scroll!
contract ScrollRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error tokenNotMapped();
    error InvalidOrder();

    uint256 constant _stateFinished = 0;
    uint256 constant _stateVerified = 1;
    uint256 constant _statePending = 2;
    uint256 constant _stateCancelled = 3;

    mapping(uint256 => uint256) private orders;

    function verifyOrder() private pure returns (bool) {
        //TODO
        return true;
    }

    function updateOrder(uint256 orderId, uint256 state) private {
        orders[orderId] = state;
    }

    function bridgeStart(uint256 amount, address srcTokenAddress, uint256 orderId) external payable nonReentrant {
        address l2GatewayRouterAddress = 0x4C0926FF5252A435FD19e10ED15e5a249Ba19d79;

        if (orders[orderId] != 0) {
            //TODO change to _stateVerified after verification order
            revert InvalidOrder();
        }

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

        updateOrder(orderId, _statePending);
    }
}
