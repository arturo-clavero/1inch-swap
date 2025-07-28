## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

---
##  Project Tasks
- [ 🚧LERA ] HTLC smart contracts
- [ 🚧LERA ] HTLC backend integration
- [ 🚧 ARTURO] Bridge smart contracts & backend integration
- [ 🚧 ARTURO] Bridge backend integration
- [ 🆓 ] Order creation (front end) & call smart contract
- [ 🆓 ] Order struct on smart contract
- [ 🆓 ] Order verification function on smart contract
- [ 🆓 ] Swaps calls from Backend (APIs)
- [ 🆓 ] Relayer backend logic (requires HTLC, swaps, and bridge finished)
- [ 🆓 ] Price feeds (connect Chainlink in ./hooks/useQuoteFetcher.js)



##  Project Setup (Local Development)

## Documentation

https://book.getfoundry.sh/

   ```env
   PORT=3000
   ```

3. **Start the backend server**:

   ```bash
   cd ./backend
   node ./server.js
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
