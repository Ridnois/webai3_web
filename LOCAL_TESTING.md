# Local Testing — USDC Payments on Anvil

Test the full USDC payment flow locally using a forked Base Sepolia chain.

## Prerequisites

- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Foundry](https://book.getfoundry.sh/) (anvil, cast)

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

## Setup

### 1. Copy the local dev environment template

```bash
cp .env.local.example .env.local
```

This sets:

- `NEXT_PUBLIC_ENABLE_DEV_CHAIN=true` — adds the Foundry chain (chainId 31337) to the wallet connector
- `RECEIVER_ADDRESS` / `NEXT_PUBLIC_RECEIVER_ADDRESS` — set to Anvil Account #1, which collects payments

### 2. Start Anvil

In a **separate terminal**:

```bash
pnpm chain:start
```

This forks Base Sepolia into a local Anvil node at `http://127.0.0.1:8545` with chainId `31337`. The USDC contract from Base Sepolia (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`) is available on the fork.

You can override the fork URL:

```bash
BASE_SEPOLIA_FORK_URL=https://your-rpc-url pnpm chain:start
```

### 3. Fund test accounts with USDC

```bash
pnpm chain:fund
```

This mints **1,000,000 USDC** to each of the first 5 Anvil accounts by impersonating the USDC masterMinter on the fork.

To fund additional addresses:

```bash
pnpm chain:fund 0xYourAddress 0xAnotherAddress
```

### 4. Start the app

```bash
pnpm dev
```

## Wallet Setup (MetaMask)

### Add the local network

| Field        | Value                      |
| ------------ | -------------------------- |
| Network name | Anvil Local                |
| RPC URL      | `http://127.0.0.1:8545`    |
| Chain ID     | `31337`                    |
| Symbol       | ETH                        |

### Import a test account

Use Anvil Account #0 (the payer):

```
Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

To see USDC in MetaMask, import the token:

```
Token address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Decimals:      6
```

## Test Accounts

All accounts are derived from the standard Anvil mnemonic: `test test test test test test test test test test test junk`

| #   | Address                                      | Role     | Private Key                                                          |
| --- | -------------------------------------------- | -------- | -------------------------------------------------------------------- |
| 0   | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Payer    | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 1   | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Receiver | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2   | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Extra    | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 3   | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Extra    | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 4   | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Extra    | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

Each account starts with **10,000 ETH** and **1,000,000 USDC** after running `pnpm chain:fund`.

## Testing the Payment Flow

1. Open `http://localhost:3000/inference/text-to-image`
2. Connect wallet (Account #0) and switch to the **Anvil Local** network
3. Select a model and fill in a prompt
4. Click **Run Inference** — the cost estimate appears in the form
5. The payment dialog opens showing the estimated cost and your USDC balance
6. Click **Pay & Run** — approve the USDC transfer in MetaMask
7. The transaction confirms on the local chain, then the inference runs
8. The result displays with actual cost

### Verify in the database

```bash
pnpm db:studio
```

Check the `inferences` table — rows should have `estimated_cost_usdc`, `actual_cost_usdc`, `payment_tx_hash`, and `payment_chain_id` populated.

### Edge cases to test

| Scenario                        | How to trigger                                              | Expected                                     |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Insufficient balance            | Transfer most USDC out of Account #0 first                  | Pay button disabled, balance shown in red     |
| User rejects wallet tx          | Click Reject in MetaMask when prompted                      | Error in dialog, can retry                    |
| Same txHash reused              | Copy a txHash and submit it in a second request             | Server returns 402                            |
| No payment data                 | Send POST to `/api/inference` without `payment` field       | Works (payment is additive to existing flow)  |

## Troubleshooting

### Port 8545 already in use

```bash
kill $(lsof -ti:8545)
pnpm chain:start
```

### MetaMask nonce issues

If MetaMask shows "nonce too high" errors after restarting Anvil, reset the account in MetaMask: **Settings → Advanced → Clear activity tab data**.

### Anvil not found

```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

### USDC balance shows 0 after funding

Make sure MetaMask is connected to the Anvil network (chainId 31337), not Base Sepolia (84532). They use the same USDC contract address but are different chains.
