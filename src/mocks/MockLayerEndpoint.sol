// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILayerZeroReceiver {
    function lzReceive(uint16 _srcChainId, bytes calldata _from, uint64 _nonce, bytes calldata _payload) external;
}

contract MockLayerZeroEndpoint {
    uint16 public chainId;

    constructor(uint16 _chainId) {
        chainId = _chainId;
    }

    mapping(uint16 => address) public remotes;

    function setRemote(uint16 _dstChainId, address _remoteEndpoint) external {
        remotes[_dstChainId] = _remoteEndpoint;
    }

    function send(uint16 _dstChainId, bytes calldata _destination, bytes calldata _payload) external {
        address dstEndpoint = remotes[_dstChainId];
        require(dstEndpoint != address(0), "No remote set");

        address dstApp = abi.decode(_destination, (address));
        ILayerZeroReceiver(dstApp).lzReceive(chainId, abi.encode(msg.sender), 0, _payload);
    }
}
