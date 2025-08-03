// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

abstract contract LayerZeroReceiver {
    function lzReceive(
        uint16 srcChainId,
        bytes memory from,
        uint64 nonce,
        bytes memory payload
    ) external virtual;
}