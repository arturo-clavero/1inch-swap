# 🚀 ETH ⇄ SCR Swap

A minimal frontend interface to swap ETH for USDC using on-chain price data (via 1inch or Chainlink), with support for Hashed Timelock Contracts (HTLCs), resolvers, relayers, and bi-directional cross-chain swaps between Ethereum and Scroll.

This project is an implementation of a trustless, atomic swap system inspired by 1inch Fusion, extended to work cross-chain. It uses LayerZero messaging and dual-escrow contracts to enable swaps with real-time pricing, off-chain order resolution, and partial fills. It also introduces a Dutch auction resolver model that incentivizes reliable behavior.

## Key Features

* Bi-directional atomic swaps between Ethereum and Scroll using HTLCs
* Real-time pricing from 1inch or Chainlink APIs
* Off-chain relayer/resolver design to verify and settle swaps
* Refunds for expired swaps
* Partial fill support (via off-chain logic)
* Audited smart contracts inspired by OpenZeppelin and 1inch best practices
* Forked local testing with Foundry and Anvil

## Upcoming Features

* Dutch auction pricing model to reward fast, trusted resolvers
* UI improvements to visualize order lifecycle and auction curve
* On-chain resolver reputation system
* Multi-asset support beyond ETH/USDC
* Bridge-less swaps to additional chains beyond Scroll
* Secure off-chain coordination layer with Redis

## Why We're Eligible

We meet all qualification requirements:

* Hashlock and timelock preserved for HTLC-based swaps
* Bi-directional swap support between Ethereum and Scroll
* Fully demoed using testnet deployments on Scroll Sepolia and Ethereum Sepolia
* Contract code and UI both support partial fills

We have studied 1inch’s open-source codebase and audits via OpenZeppelin to ensure security and architectural alignment with Fusion+. This project was designed with extensibility and real-world application in mind.



##  Project Setup (Local Development)

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   npm install
``

2. **Create a `.env` file**:

   ```env
   PORT=3000   
   ETH_CONTRACT_ADDRESS=0x174c06c59E3C33B8d075330BB09C3Bfe11b7146e
   SCROLL_CONTRACT_ADDRESS=0xc7c1a51124F7CBD3D244a51046B0dD9FAA3850bA
   PRIVATE_KEY=your_wallet_private_key
   ONEINCH_API_KEY=your_api_key
   ##for test CHANGE LATER
   ETH_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/gEJiAZLcZKDjZQBd9LOsS"
   SCROLL_RPC_URL="https://sepolia-rpc.scroll.io/"
   VITE_ETH_CONTRACT_ADDRESS=0x174c06c59E3C33B8d075330BB09C3Bfe11b7146e
   VITE_SCROLL_CONTRACT_ADDRESS=0xc7c1a51124F7CBD3D244a51046B0dD9FAA3850bA
   ETH_WC_URL="wss://eth-sepolia.g.alchemy.com/v2/yourAPI"
   SCROLL_WC_URL="wss://scroll-sepolia.gateway.tenderly.co/yourAPI"
   ```

3. **Start the backend server**:

   ```bash
   cd ./backend
   npm install
   node ./server.js
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

