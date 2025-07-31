
# resolver Action Tester

This branch can be forked to test resolver actions in a mocked environment before integrating with main.

## 1. Purpose

This tool helps test and simulate resolver behavior and logic using mock actions. These actions are implemented to validate layout, sequencing, event listening, and smart contract interaction in a controlled environment.


## 2. How to Test an Action

In the constructor of the `resolver` class, you'll find the `this.actions` array. You can import action functions here from:

```bash
./backend/blockchain/resolvers/actions/
```

### Action Execution

* Actions will be executed **in the order they appear in the array**.
* Each action must call `self.nextAction()` at the end to trigger the next step in the sequence.

### Testing Strategies

You can:

* **Substitute a mock function** with a new one.
* **Add a new action** to the mock flow.
* **Test a single action** or a group of specific interactions in isolation.

Use the current mock flow and action files as examples of how to use available helper functions (like smart contract access and event waiting) to write your own actions efficiently.


## 3. Action Format

Each action must be a function that:

* Takes `self` as the first parameter.
* Uses `self.nextAction()` at the end to trigger the next action in sequence.
* Can optionally listen for smart contract events using helper methods.

### Event Listeners

To wait for events:

* Use `await self.waitForEvent()` inside your action.
* Reference implementation:
  [`./backend/blockchain/resolvers/actions/startBridge.js`](./backend/blockchain/resolvers/actions/startBridge.js)

To run infinite listeners (e.g., for assignment):

* Use `ContractListener.start()` method.
* Reference implementation:
  [`./backend/blockchain/resolvers/actions/assignOrder.js`](./backend/blockchain/resolvers/actions/assignOrder.js)

---

## 4. Contracts

To use a smart contract in your actions, you need to import and configure it.

### Steps to Import a Contract

1. **Compile Contract**
   Use `remix` or `foundry` to compile and extract the ABI.

2. **Add ABI**
   Paste the ABI JSON into a new file in:

   ```bash
   ./backend/blockchain/contracts/abi/
   ```

3. **Deploy Contract**
   Deploy using `remix`, `foundry`, or locally with Anvil.
   If using Anvil, ensure it is running during testing.

4. **Register Contract**
   Add contract details (name, address, ABI path) in:

   ```bash
   ./backend/blockchain/contracts/contractData.js
   ```

5. **Add to contractData.js**

   Add an object like this:

   ```js
   contractData["MyContract"] = {
     address: "0x...",
     abi: require("./abi/MyContract.json"),
     provider: new ethers.providers.JsonRpcProvider(process.env.RPC_WS_ANVIL) // or your preferred RPC
   };
   ```

6. **Configure .env**

   Make sure the following values are set:

   ```
   PORT=3000
   RPC_WS_ANVIL=http://127.0.0.1:8545
   WALLET_PRIVATE_KEY=your_private_key_without_quotes
   ```

   If using Anvil, use one of the mock private keys printed at launch.

7. **Use in Code**

   Example to access and call a function from your contract:

   ```js
   const contractData = require("./backend/blockchain/contracts/contractData.js");
   const contract = contractData["MyContract"];
   await contract.myFunction();
   ```

---

## 5. .env File

Place your `.env` file at the root level of the project (same level as `backend/` and `src/`).

### Example

```
PORT=3000
RPC_WS_ETHEREUM=https://rpc.sepolia.org
RPC_WS_SCROLL=https://sepolia-rpc.scroll.io
RPC_WS_ANVIL=http://127.0.0.1:8545
RPC_WS_PUBLIC_TESTNET=http://127.0.0.1:8545
WALLET_PRIVATE_KEY=0xac0974bec39a17e36b...
```

Got it—here’s the cleaned-up version without emojis:

---

## 6. How to Run the Current Setup

### Step 1: Configure Environment

* Create a `.env` file in the root directory.
* Follow the format shown in `.env.example`.

---

### Step 2: Run the Services

Open **three terminal windows**:

**Terminal 1 – Frontend**

```bash
npm run dev
```

**Terminal 2 – Local Blockchain (Anvil)**

```bash
anvil
```

**Terminal 3 – Backend**

```bash
cd backend
npm install
node ./server.js
```

---

### Step 3: Deploy the Smart Contract

1. Open Remix IDE (or Forge).
2. Load the file:
   `./blockchain/backend/contracts/fakeContract.sol`
3. Compile and deploy the contract to the Anvil local network.
4. Copy the deployed contract address.
5. Open `./contracts/contractData.js` and update the `router` object's `address` field with the new address.
6. If you change the contract:

   * Recompile it.
   * Update the ABI in `./blockchain/backend/contracts/abi/router.json`.

---

### Step 4: Test the Flow

After deploying the contract, click **"Order Verified"** in Remix to trigger the flow.
