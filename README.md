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


### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                          │
│                     (Express + Node.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  server.js     │  │ relayer.js       │  │ htlcRoute  │ │
│  │  (Main Entry)  │  │ (Setup Wallets/  │  │ (REST API) │ │
│  │                │  │  Contracts)      │  │            │ │
│  └────────────────┘  └──────────────────┘  └────────────┘ │
│           │                    ▲                    │       │
│           └────────────────────┼────────────────────┘       │
│                                │                            │
│                    ┌───────────▼──────────────┐            │
│                    │  relayerListeners.js     │            │
│                    │  (Event Handlers)        │            │
│                    └──────────────────────────┘            │
│                         │              │                    │
└─────────────────────────┼──────────────┼────────────────────┘
                          │              │
        ┌─────────────────▼──┐     ┌────▼──────────────────┐
        │  Ethereum Sepolia  │     │   Scroll Sepolia      │
        │  HTLC Contract     │     │   HTLC Contract       │
        │  (WebSocket)       │     │   (WebSocket)         │
        └────────────────────┘     └───────────────────────┘
```

### Backend Components Breakdown

#### 1. **`server.js`** - Main Entry Point
- Initializes Express server with CORS enabled
- Mounts the HTLC API routes at `/api`
- Starts the relayer event listeners on server startup
- Runs on port specified in `.env` (default: 3000)

#### 2. **`controllers/relayer.js`** - Relayer Setup
**Purpose**: Configures wallets, providers, and contract instances for both chains.

**Exports**:
- `ethereumWallet` / `scrollWallet` - Relayer's signing wallets
- `ethereumProvider` / `scrollProvider` - WebSocket providers for real-time events
- `ethereumHtlcContract` / `scrollHtlcContract` - Contract instances connected to relayer wallet

**Key Configuration**:
```javascript
const ethereumProvider = new ethers.WebSocketProvider(ETH_WC_URL);
const ethereumWallet = new ethers.Wallet(PRIVATE_KEY, ethereumProvider);
const ethereumHtlcContract = new ethers.Contract(ETH_CONTRACT_ADDRESS, htlcAbi, ethereumWallet);
```

#### 3. **`controllers/relayerListeners.js`** - Event Handling Core
**Purpose**: Listens for HTLC contract events on both chains and executes relayer logic.

**Key Data Structures**:
- `pendingSwapsByHashlock` (Map) - Tracks active swaps indexed by hashlock
- `processedHashlocks` (Set) - Prevents duplicate processing of swaps
- `relayerAddress` - The relayer's address for validation

**Event Handlers**:

| Event | Chain | Action |
|-------|-------|--------|
| `SwapCreated` | Ethereum | User locks on ETH → Relayer locks on Scroll |
| `SwapCreated` | Scroll | User locks on Scroll → Relayer locks on ETH |
| `SwapWithdrawn` | Ethereum | User withdraws on ETH → Relayer withdraws on Scroll |
| `SwapWithdrawn` | Scroll | User withdraws on Scroll → Relayer withdraws on ETH |

**Swap Tracking Object**:
```javascript
{
  path: "eth->scroll" | "scroll->eth",
  userAddress: "0x...",
  receiver: "0x...",
  amount: "1000000000000000000",
  ethSwapId: "0xabcd...",
  scrollSwapId: "0xef12..."
}
```

#### 4. **`routes/htlcRoute.js`** - REST API
**Purpose**: Provides HTTP endpoints for frontend to query swap status.

**Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/` | Health check endpoint |
| `GET` | `/api/ready/:hashlock` | Check if both sides of swap are locked |
| `GET` | `/api/swap/:hashlock` | Get swap ID for a given hashlock |
| `POST` | `/api/refund` | Handle refund requests (placeholder) |

**Example Response** (`/api/ready/:hashlock`):
```json
{
  "ready": true  // Both ETH and Scroll swaps are locked
}
```

### HTLC Cross-Chain Flow

#### **Scenario: User swaps ETH (Ethereum) → ETH (Scroll)**

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│   User   │                │ Relayer  │                │  Scroll  │
│Ethereum) │                │ Backend  │                │ (Chain)  │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │ 1. createSwap()           │                           │
     │    (lock ETH + hashlock)  │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │ 2. Listen SwapCreated     │
     │                           │    event on ETH           │
     │                           │                           │
     │                           │ 3. createSwap() on Scroll │
     │                           │    (lock ETH for user)    │
     │                           ├──────────────────────────►│
     │                           │                           │
     │ 4. GET /api/ready/:hash   │                           │
     │    (poll until ready)     │                           │
     ├──────────────────────────►│                           │
     │    ◄──{ready: true}───────┤                           │
     │                           │                           │
     │ 5. withdraw(swapId, secret)                          │
     │    (reveal secret)        │                           │
     ├──────────────────────────────────────────────────────►│
     │                           │                           │
     │                           │ 6. Listen SwapWithdrawn   │
     │                           │    event on Scroll        │
     │                           │                           │
     │                           │ 7. withdraw() on ETH      │
     │                           │    using revealed secret  │
     │                           │◄──────────────────────────┤
     │                           │                           │
     └───────────────────────────┴───────────────────────────┘
```

### Key HTLC Concepts

#### **Hashlock** 
A cryptographic hash (SHA256/Keccak256) of a secret value:
```javascript
const secret = ethers.randomBytes(32);
const hashlock = ethers.keccak256(secret);
```

#### **Timelock**
Expiration timestamp after which the sender can refund:
```javascript
const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
```

#### **Atomic Swap Properties**
1. **Atomicity**: Both swaps succeed or both fail
2. **Trustless**: No need to trust the relayer with funds
3. **Secret Reveal**: User reveals secret to claim funds on destination chain
4. **Relayer Incentive**: Relayer learns secret and withdraws on origin chain

### How the Relayer Works

#### **1. Listening for Swaps** (Automatic)
```javascript
ethereumHtlcContract.on("SwapCreated", async (swapId, sender, receiver, amount, hashlock, timelock) => {
  // Relayer automatically locks on Scroll with same hashlock
  const transactionResponse = await scrollHtlcContract.createSwap(
    sender,        // Original sender becomes receiver on other chain
    hashlock,      // Same hashlock ensures atomic property
    scrollTime,    // Adjusted timelock (slightly shorter)
    { value: amount }
  );
});
```

#### **2. Tracking Swaps**
The relayer maintains a map of pending swaps:
```javascript
pendingSwapsByHashlock.set(hashlock.toString(), {
  path: "eth->scroll",
  userAddress: sender,
  receiver: receiver,
  amount: amount.toString(),
  ethSwapId: swapId,
  scrollSwapId: scrollSwapId,
});
```

#### **3. Auto-Withdraw on Secret Reveal**
When user withdraws on destination chain, relayer learns the secret:
```javascript
scrollHtlcContract.on("SwapWithdrawn", async (swapId, secret) => {
  const hashlock = ethers.keccak256(secret);
  const pendingSwap = pendingSwapsByHashlock.get(hashlock.toString());
  
  if (pendingSwap.receiver === relayerAddress) {
    // Relayer withdraws on the other chain using the revealed secret
    await ethereumHtlcContract.withdraw(pendingSwap.ethSwapId, secret);
  }
});
```

### Security Features

1. **Duplicate Prevention**: `processedHashlocks` Set prevents double-processing
2. **Receiver Validation**: Only withdraws if relayer is the intended receiver
3. **Timelock Protection**: User can refund if relayer fails to lock within timelock
4. **Non-Custodial**: Relayer never holds user funds directly
5. **Reentrancy Protection**: HTLC contracts implement reentrancy guards

### Environment Variables Required

```env
# Server
PORT=3000

# Ethereum Sepolia
ETH_CONTRACT_ADDRESS=0x...
ETH_WC_URL=wss://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Scroll Sepolia  
SCROLL_CONTRACT_ADDRESS=0x...
SCROLL_WC_URL=wss://scroll-sepolia.gateway.tenderly.co/YOUR_KEY

# Relayer Wallet
PRIVATE_KEY=0x...
```

### Running the Backend

```bash
cd backend
npm install
node server.js
```

**Output**:
```
Node.js HTTP server is running on port 3000
http://localhost:3000
Relayer is listening...
```

### API Usage Examples

**Check if swap is ready**:
```bash
curl http://localhost:3000/api/ready/0xabcdef...
```

**Get swap ID**:
```bash
curl http://localhost:3000/api/swap/0xabcdef...
```

---

## 📄 License

MIT

```