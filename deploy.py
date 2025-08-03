anvil --port 8545 --chain-id 31337 --fork-url https://eth-sepolia.g.alchemy.com/v2/lfoH-lz37WW66uJTyGdHi


anvil --port 8546 --chain-id 31338 --fork-url https://scroll-sepolia.g.alchemy.com/v2/lfoH-lz37WW66uJTyGdHi
TOKEN:
forge script TestTokenScript\
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e



LEFT:
forge script EthereumRouterScript\
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

RIGHT:
forge script sScrollRouterScript\
  --rpc-url http://127.0.0.1:8546 \
  --broadcast \
  --private-key 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6


LEFT:
//ENDPOINT L    //ENDPOINT R
cast send 0x15223d419c2efB0354836a251b44FEcC64c2156d "setRemote(uint16,address)" 31337 0x82C6D3ed4cD33d8EC1E51d0B5Cc1d822Eaa0c3dC \
  --rpc-url http://127.0.0.1:8545 \
  --private-key  0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

RIGHT:
//ENDPOINT R    //ENDPOINT L
cast send 0x82C6D3ed4cD33d8EC1E51d0B5Cc1d822Eaa0c3dC "setRemote(uint16,address)" 31338 0x15223d419c2efB0354836a251b44FEcC64c2156d \
  --rpc-url http://127.0.0.1:8546 \
  --private-key  0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6


LEFT:
//ROUTER L    //ROUTER R
cast send 0xc22CC94e52C2cE85B57b78bc7038fEe1c3cC3FEa "setDestinationContract(address)"  0xc22CC94e52C2cE85B57b78bc7038fEe1c3cC3FEa\
  --rpc-url http://127.0.0.1:8545 \
  --private-key  0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

//ROUTER R    //ROUTER L
cast send 0xc22CC94e52C2cE85B57b78bc7038fEe1c3cC3FEa "setDestinationContract(address)" 0xc22CC94e52C2cE85B57b78bc7038fEe1c3cC3FEa\
  --rpc-url http://127.0.0.1:8546 \
  --private-key  0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
#   --account anvilWallet \
#   --sender 0xf39f...266