# 🚀 ETH ⇄ USDC Swap UI

A minimal frontend interface to swap ETH for USDC using on-chain price data from 1inch or other APIs. Built with Vite and React.

---
##  Project Tasks
- [ 🚧LERA ] HTLC smart contracts
- [ 🚧LERA ] HTLC backend integration
- [ 🚧 ARTURO] Bridge backend integration
- [ 🚧 CHAK ] Order creation (front end)
- [ 🆓 ] Swaps calls from Backend (APIs)
- [ 🆓 ] Dutch auction (time based lower price for relayers)
- [ 🆓 ] Relayer backend logic (requires HTLC, bridge, swap and auction finished)
- [ 🆓 ] Price feeds (connect Chainlink in ./hooks/useQuoteFetcher.js)



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
   ETH_CONTRACT_ADDRESS=0xCFcaC62C31821bB88582936A767C21688D60B603
   SCROLL_CONTRACT_ADDRESS=0x8Ad9d5e721b839c66684aA2fB7e014481859b151
   PRIVATE_KEY=your_wallet_private_key
   ##for test CHANGE LATER
   ETH_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/gEJiAZLcZKDjZQBd9LOsS"
   SCROLL_RPC_URL="https://sepolia-rpc.scroll.io/"
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


## Contributor Rules & Git Workflow

### DO NOT PUSH TO `main` DIRECTLY

> `main` is a protected branch. All changes must be submitted via Pull Request (PR).

### Branch Naming

* Always work on your **own branch**
* Use meaningful branch names, e.g.:

  * `feat/swap-form-ui`
  * `fix/token-decimals-bug`
  * `chore/setup-proxy-server`

Create a branch like this:

```bash
git checkout -b feat/your-feature-name
```

---

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for clarity:

| Type       | Purpose                     |
| ---------- | --------------------------- |
| `feat`     | A new feature               |
| `fix`      | A bug fix                   |
| `chore`    | Setup, tooling, minor tasks |
| `docs`     | Documentation only          |
| `style`    | Formatting, no code changes |
| `refactor` | Code restructuring          |

**Examples:**

```bash
git commit -m "feat: add USDC price fetch"
git commit -m "fix: handle failed swap edge case"
git commit -m "chore: add CORS proxy setup"
```

---

### Pushing & Pull Requests

* Push **only to your branch**
* Open a **Pull Request** targeting `main`
* Write a **clear title and description**
* Tag reviewers if needed

Before submitting a PR, please ensure:

* [ ] The app builds and runs locally
* [ ] No console errors or warnings
* [ ] Proper commit message format is used
* [ ] No sensitive data or `.env` files are committed

---

## 🛠 Example `.env`

```env
PORT=3000
VITE_1INCH_API_KEY=your_actual_api_key
ETH_CONTRACT_ADDRESS=0xCFcaC62C31821bB88582936A767C21688D60B603
SCROLL_CONTRACT_ADDRESS=0x8Ad9d5e721b839c66684aA2fB7e014481859b151
PRIVATE_KEY="Your_wallet_Private_Key"
ETH_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/You_API_KEY"
SCROLL_RPC_URL="https://sepolia-rpc.scroll.io/"
ETH_WC_URL="wss://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
SCROLL_WC_URL="wss://scroll-sepolia.gateway.tenderly.co/API_GATEWAY"
RELAYER_ADDRESS="0x75AE055963B893aDEC72eB14B85570C39a4d62BB"
VITE_ETH_CONTRACT_ADDRESS=0xCFcaC62C31821bB88582936A767C21688D60B603
VITE_SCROLL_CONTRACT_ADDRESS=0x8Ad9d5e721b839c66684aA2fB7e014481859b151
```

Access it in your code via:

```js
const apiKey = import.meta.env.VITE_1INCH_API_KEY;
```

---


## 📄 License

MIT

```
