## Zattak

Zattak is an end-to-end DeFi experience built for the Rootstock ecosystem.
It lets users swap supported tokens (rUSDT, USDT, etc.) into RIF and stake the
resulting RIF in a single, atomic transaction so stRIF balances increase
immediately without juggling wallets, approvals, or multiple transactions.

### Why Zattak?
- **One-click staking** – swap + stake in a single click.
- **Atomic safety** – if one step fails, everything reverts.
- **User‑first UX** – the dApp shows expected output, balances, and stRIF deltas in real time.

### What does it do?
1. Takes user-selected tokens (rUSDT/USDT/etc.)
2. Routes them through Sushi swap to get RIF
3. Stakes the RIF into the Rootstock staking contract
4. Handles every approval + swaps + deposit under the hood
5. Returns freshly minted stRIF to the user

### What's Included
- `contracts/`: Foundry workspace with `RIFDepositer` (main production contract)
  plus testing helpers.
- `Frontend/`: React/Vite dApp for connecting wallets, selecting tokens, and
  triggering the on-chain batching / staking flow.
- `Script/`: Helper scripts (e.g., `generate-calldata.js`) for producing swap
  calldata used inside tests and simulations.

---

## Setup

### Prerequisites
- Node.js 18+
- npm (or yarn/pnpm)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)

### Install Dependencies
```bash
# Contracts (Foundry)
cd contracts
forge install

# Frontend
cd ../Frontend
npm install

# Scripts (calldata generator)
cd ../Script
npm install
```

### Environment
- `Frontend/.env`
  ```
  VITE_WALLETCONNECT_PROJECT_ID=<your_id>
  VITE_RIF_BATCH_DEPOSITER=<deployed_RIFDepositer_address>
  ```
- `Script/.env` (optional—defaults provided)
  ```
  RSK_RPC_URL=https://public-node.rsk.co
  ```

---

## Usage

### Smart Contracts
```bash
cd contracts
# Compile
forge build

# Run a specific test on Rootstock fork
forge test --fork-url https://public-node.rsk.co -vvv --match-test testExecuteCallsAndDepositWithRUSDT
```

### Calldata Generation
```bash
cd Script
node generate-calldata.js
# Outputs swap calldata for rUSDT → RIF and USDT → RIF flows
```

### Frontend
```bash
cd Frontend
npm run dev
# Visit http://localhost:5173
```

From the UI, connect a wallet on Rootstock testnet, choose tokens + amounts,
and click “Swap & Stake” to run the full batch/approve/stake flow in one go.

