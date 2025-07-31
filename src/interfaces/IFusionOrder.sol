// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IFusionOrder {
    struct Order {
        uint256 orderId;
        address maker;
        address sourceToken;
        uint256 sourceAmount;
        address destinationToken;
        uint32 sourceChainId;
        uint32 destinationChainId;
        uint256 startReturnAmount;
        uint256 startTimestamp;
        uint256 minReturnAmount;
        uint256 expirationTimestamp;
        bytes signature;
    }
}