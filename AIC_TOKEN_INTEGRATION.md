# AIC Token Integration — Technical Specification

This document describes the planned integration of the AIC (`WebAI3Token`) governance token into the `webai3_web` inference platform. It covers the current architecture baseline, then details Tier 1 (staking discounts + AIC-as-payment) and Tier 2 (burn-on-use + access gating) integration plans with precise implementation steps for every layer of the stack.

---

## 1. Current Architecture Baseline

### 1.1 Authentication

Users authenticate via Sign-In With Ethereum (SIWE / EIP-4361). The flow is:

```
GET  /api/auth/nonce   → server generates + stores a one-time nonce in iron-session
POST /api/auth/verify  → server verifies the SIWE signature, upserts the user in PostgreSQL, writes session
GET  /api/auth/session → client reads session (address + chainId)
POST /api/auth/logout  → destroys the encrypted cookie
```

Session data stored: `{ address: string (lowercase), chainId: number }`. No private keys or tokens are stored. The session is an encrypted HTTP-only cookie managed by `iron-session`.

### 1.2 Inference & Payment Pipeline

The complete flow for a paid inference request:

```
1. Client → POST /api/inference/estimate
           ← { estimatedCostUsdc, estimatedSeconds }

2. Client → POST /api/inference                          (no Payment-Signature header)
           ← 402 Payment Required
              Header: Payment-Required: <base64-encoded PaymentRequiredResponse>
              Body:   { error, code, estimatedCostUsdc }

3. Client → signs EIP-712 TransferWithAuthorization message (EIP-3009)
           (useX402Payment hook, wagmi signTypedDataAsync)

4. Client → POST /api/inference                          (with Payment-Signature header)
   Server:
     a. Decode + Zod-validate the Payment-Signature header
     b. Call x402 facilitator /verify  → confirm signature is valid
     c. Call x402 facilitator /settle  → execute on-chain USDC transfer
     d. Replicate.run(model, input)    ← inference runs only after settlement
     e. Upload media to Cloudflare R2  (if image/audio output)
     f. INSERT into `inferences` table
     ← 200 { id, output, status, metrics }
```

**Settlement is irrevocable and happens before inference.** If inference or upload fails after settlement, the failure is recorded alongside the payment tx hash so it can be investigated, but the USDC is not refunded automatically.

### 1.3 Pricing

`src/lib/pricing.ts` computes costs purely from time:

```ts
estimateCostUsdc(task, ratePerSec, overrideSeconds?)
// → rounds to 6 decimal places (USDC precision)

actualCostUsdc(predictTimeMs, ratePerSec)
// → computed post-inference from real Replicate execution time
```

Default rate: `$0.001 USDC / second` of compute (env `INFERENCE_RATE_PER_SEC`). Task time defaults:

| Task | Default seconds |
|---|---|
| `text-to-image` | 10 |
| `text-to-text` | 3 |
| `text-to-sound` | 15 |

The server also queries the `inferences` table for historical average `predict_time_ms` per model (then per task as fallback) to give more accurate cost estimates over time.

### 1.4 x402 Protocol Details

x402 is a payment protocol that extends HTTP 402. The server uses x402 v2:

- **PaymentRequiredResponse**: sent on the initial un-paid request. Specifies the USDC asset address, amount (6-decimal bigint as string), recipient address (`RECEIVER_ADDRESS`), network (CAIP-2 format), and EIP-712 domain hints.
- **PaymentPayload**: the client constructs this after signing. Contains the `TransferWithAuthorization` authorization struct and the EIP-712 signature.
- **Facilitator** (`X402_FACILITATOR_URL`, default `https://www.x402.org/facilitator`): a trusted third-party service that:
  - `/verify` — validates the signature and checks the authorization hasn't been spent
  - `/settle` — submits the on-chain `transferWithAuthorization` transaction and returns the tx hash

On local Anvil dev chains, facilitator calls are skipped and a random UUID is used as the mock tx hash.

### 1.5 Data Model

PostgreSQL via Drizzle ORM. Relevant tables:

**`users`**
```
address        text PRIMARY KEY   — wallet address, lowercase
created_at     timestamptz
last_seen_at   timestamptz
```

**`inferences`**
```
id                  uuid PK
user_address        text FK → users.address
task_type           enum (text-to-image | text-to-text | text-to-sound)
model               text
input               jsonb
output_type         enum (text | image | audio)
output_data         jsonb
r2_keys             jsonb (string[])
status              enum (pending | succeeded | failed)
error_message       text
predict_time_ms     integer
estimated_cost_usdc numeric(18,6)
actual_cost_usdc    numeric(18,6)
payment_tx_hash     text UNIQUE
payment_chain_id    integer
is_public           integer (0|1)
created_at          timestamptz
```

### 1.6 Token Contract (read-only reference)

`WebAI3Token` (Solidity 0.8.24, OpenZeppelin v5) lives in `webai3_token/`. Key properties:

- Symbol: `AIC`, Decimals: 18, Max supply: 1,000,000,000 (fixed at deployment, no mint function)
- Inherits: `ERC20`, `ERC20Pausable`, `ERC20Permit` (EIP-2612), `ERC20Votes`, `AccessControl`
- Roles: `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`

There is **no staking contract yet**. A dedicated staking contract must be built before Tier 1 discount logic can be read on-chain.

---

## 2. Tier 1 — Staking Discounts + AIC-as-Payment

### 2.1 Overview

Tier 1 establishes the core utility loop:

1. **Hold AIC → stake it → get a lower inference rate.** Stakers pay less per second of compute.
2. **Pay with AIC instead of USDC.** AIC holders can route payment through AIC rather than stablecoin.

Both features independently increase demand to hold AIC: staking to reduce costs, and having AIC on hand to use the platform.

### 2.2 Required: AIC Staking Contract

A new `AICStak.sol` contract (or similar name) must be deployed. Minimum interface:

```solidity
interface IAICStaking {
    /// @notice Returns the total AIC staked by `account` (locked, not yet unstaked).
    function stakedBalance(address account) external view returns (uint256);

    /// @notice Stakes `amount` of AIC tokens. Requires prior ERC-20 approval.
    function stake(uint256 amount) external;

    /// @notice Initiates unstake. May have a cooldown before withdrawal.
    function unstake(uint256 amount) external;

    /// @notice Withdraws previously unstaked tokens after cooldown.
    function withdraw() external;
}
```

The contract should be deployed on Base (same network as inference payments). The address becomes a new env var `NEXT_PUBLIC_AIC_STAKING_ADDRESS` (client) and `AIC_STAKING_ADDRESS` (if needed server-side).

### 2.3 Discount Tiers

Recommended tier schedule (values are starting points — tune with governance):

| Staked AIC | Discount | Effective rate (at $0.001/s default) |
|---|---|---|
| 0 | 0% | $0.001000 / sec |
| ≥ 1,000 | 10% | $0.000900 / sec |
| ≥ 10,000 | 20% | $0.000800 / sec |
| ≥ 50,000 | 35% | $0.000650 / sec |
| ≥ 200,000 | 50% | $0.000500 / sec |

### 2.4 Implementation: Staking Discount

#### 2.4.1 `src/lib/contracts.ts` — add AIC + staking addresses

```ts
// Existing USDC entries remain unchanged.

interface AicConfig {
  tokenAddress: Address;
  stakingAddress: Address;
  decimals: number;
}

const aicContracts: Record<number, AicConfig> = {
  [base.id]: {
    tokenAddress: "0x<MAINNET_AIC_ADDRESS>",
    stakingAddress: "0x<MAINNET_STAKING_ADDRESS>",
    decimals: 18,
  },
  [baseSepolia.id]: {
    tokenAddress: "0x<SEPOLIA_AIC_ADDRESS>",
    stakingAddress: "0x<SEPOLIA_STAKING_ADDRESS>",
    decimals: 18,
  },
  [foundry.id]: {
    tokenAddress: "0x<SEPOLIA_AIC_ADDRESS>",   // Anvil fork reuses Sepolia
    stakingAddress: "0x<SEPOLIA_STAKING_ADDRESS>",
    decimals: 18,
  },
};

export function getAicConfig(chainId: number): AicConfig | undefined {
  return aicContracts[chainId];
}
```

All contract addresses must live here — never hardcode them in components or hooks.

#### 2.4.2 `src/lib/pricing.ts` — add discount computation

```ts
const DISCOUNT_TIERS = [
  { minStaked: 200_000, discount: 0.50 },
  { minStaked:  50_000, discount: 0.35 },
  { minStaked:  10_000, discount: 0.20 },
  { minStaked:   1_000, discount: 0.10 },
] as const;

/**
 * Returns the discount multiplier (0.0–1.0) for a given staked AIC balance.
 * `stakedAic` is a human-readable number (i.e. already divided by 1e18).
 */
export function discountMultiplier(stakedAic: number): number {
  for (const tier of DISCOUNT_TIERS) {
    if (stakedAic >= tier.minStaked) return 1 - tier.discount;
  }
  return 1;
}

/**
 * Apply the staking discount to a base rate.
 */
export function discountedRate(baseRatePerSec: number, stakedAic: number): number {
  return roundUsdc(baseRatePerSec * discountMultiplier(stakedAic));
}
```

Existing `estimateCostUsdc` and `actualCostUsdc` already accept `ratePerSec` as a parameter — no changes needed there. The server reads the user's staked balance and derives the discounted rate before calling these functions.

#### 2.4.3 `src/lib/server-env.ts` — new env vars

```ts
AIC_TOKEN_ADDRESS: z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/)
  .optional(),  // optional until mainnet launch

AIC_STAKING_ADDRESS: z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/)
  .optional(),
```

When either is absent, the server treats staked balance as 0 (no discount). This allows gradual rollout.

#### 2.4.4 `src/lib/env.ts` — new public env vars

```ts
NEXT_PUBLIC_AIC_TOKEN_ADDRESS: z.string().optional(),
NEXT_PUBLIC_AIC_STAKING_ADDRESS: z.string().optional(),
```

#### 2.4.5 `src/lib/staking.ts` — server-side balance read (new file)

The server must read the staked balance on-chain before computing the discounted rate. Use `viem` directly (no wagmi on the server):

```ts
import { createPublicClient, http, erc20Abi } from "viem";
import { base, baseSepolia } from "viem/chains";
import type { Address } from "viem";
import { getServerEnv } from "./server-env";

const STAKING_ABI = [
  {
    name: "stakedBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export async function readStakedAic(
  userAddress: Address,
  chainId: number
): Promise<number> {
  const env = getServerEnv();
  if (!env.AIC_STAKING_ADDRESS) return 0;

  const chain = chainId === base.id ? base : baseSepolia;
  const rpcUrl = chainId === base.id
    ? process.env.NEXT_PUBLIC_BASE_RPC_URL
    : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

  const client = createPublicClient({ chain, transport: http(rpcUrl) });

  const raw = await client.readContract({
    address: env.AIC_STAKING_ADDRESS as Address,
    abi: STAKING_ABI,
    functionName: "stakedBalance",
    args: [userAddress],
  });

  // Convert from 18-decimal bigint to human-readable number
  return Number(raw) / 1e18;
}
```

This is a pure read — no transaction, no gas cost. On failure (RPC error, contract not deployed), it should log and return `0` so the user is not blocked.

#### 2.4.6 `src/app/api/inference/route.ts` — apply discount

In Phase 1 (the 402 response) and Phase 2 (the settle + actual cost), the effective rate must account for the user's staked balance:

```ts
// After auth check, before computing any costs:
const stakedAic = await readStakedAic(auth.address as Address, chainId)
  .catch((e) => { console.error("[inference] staking read failed:", e); return 0; });

const ratePerSec = discountedRate(parseFloat(env.INFERENCE_RATE_PER_SEC), stakedAic);

// All subsequent calls to estimateCostUsdc / actualCostUsdc use this `ratePerSec`.
```

The `stakedAic` and the final `ratePerSec` (after discount) should also be stored in the `inferences` table so costs are auditable:

**Schema additions** (`src/lib/db/schema.ts`):
```ts
stakedAicAtTime:   numeric("staked_aic_at_time",   { precision: 30, scale: 18 }),
discountPct:       numeric("discount_pct",           { precision: 5,  scale: 2  }),
effectiveRateUsdc: numeric("effective_rate_usdc",    { precision: 18, scale: 9  }),
```

#### 2.4.7 `src/app/api/inference/estimate/route.ts` — include discount

The estimate endpoint must also read the staked balance and return the discounted estimate, plus the applicable discount percentage:

```ts
// Response body addition:
{
  estimatedCostUsdc: number,
  estimatedSeconds:  number,
  discountPct:       number,  // e.g. 20 (for 20% off)
  effectiveRate:     number,  // discounted rate per second
}
```

#### 2.4.8 Client hooks: `src/hooks/use-aic-staking.ts` (new file)

```ts
"use client";

import { useReadContract, useAccount, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { getAicConfig } from "@/lib/contracts";

const STAKING_ABI = [
  {
    name: "stakedBalance",
    type: "function" as const,
    stateMutability: "view" as const,
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export function useAicStaking() {
  const { address } = useAccount();
  const chainId = useChainId();
  const aicConfig = getAicConfig(chainId);

  const { data: stakedRaw, isLoading } = useReadContract({
    abi: STAKING_ABI,
    address: aicConfig?.stakingAddress,
    functionName: "stakedBalance",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address && aicConfig), retry: 2 },
  });

  const stakedFormatted = stakedRaw !== undefined
    ? parseFloat(formatUnits(stakedRaw, 18)).toLocaleString()
    : undefined;

  return { stakedRaw, stakedFormatted, isLoading };
}
```

#### 2.4.9 `src/hooks/use-wallet-balances.ts` — add AIC balance

Extend the existing hook to also read the raw AIC token balance (not staked — just wallet balance):

```ts
// Add inside useWalletBalances:
const aicConfig = chainId ? getAicConfig(chainId) : undefined;

const { data: aicRaw, isLoading: aicLoading } = useReadContract({
  abi: erc20Abi,
  address: aicConfig?.tokenAddress,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  chainId,
  query: { enabled: Boolean(address && aicConfig), retry: 2 },
});

const aicFormatted = aicRaw !== undefined
  ? parseFloat(formatUnits(aicRaw, 18)).toLocaleString()
  : undefined;

// Return also: aicFormatted, aicRaw
```

#### 2.4.10 UI: cost estimate component

`src/components/inference/cost-estimate.tsx` should display the discount when applicable:

```
Estimated cost: $0.0080     (was $0.0100 — 20% AIC staking discount)
Your staked AIC: 12,500 AIC
```

If the user has no stake, show a call-to-action linking to the staking UI or the landing page.

---

### 2.5 Implementation: AIC-as-Payment Token

This allows users to pay inference fees in AIC instead of USDC.

#### 2.5.1 Design constraints

x402 currently wraps USDC's EIP-3009 `transferWithAuthorization`. AIC implements EIP-2612 (`permit`) but **not** EIP-3009. Two options:

**Option A — AIC with EIP-2612 + custom facilitator path**
Use `permit` (gasless approval) + `transferFrom`. Requires the x402 facilitator or a custom settlement path to support this pattern. The facilitator submits two transactions: `permit` then `transferFrom`.

**Option B — Require AIC to implement EIP-3009**
Upgrade the `WebAI3Token` contract to also inherit `ERC20WithAuthorization` (a custom extension). This allows x402 to work identically to USDC, just pointing to a different asset address and EIP-712 domain.

**Recommendation: Option B**, implemented in a new version of the token contract or a separate wrapper. This keeps the x402 integration uniform and avoids custom facilitator logic.

#### 2.5.2 AIC pricing

AIC is not a stablecoin. The server needs an AIC/USD exchange rate to express inference costs in AIC. Rate sources (in order of preference):

1. **On-chain TWAP** from a Uniswap v3 AIC/USDC pool on Base (most decentralized, gas-free reads)
2. **Off-chain price API** (CoinGecko, CoinMarketCap) — simpler but introduces centralization
3. **Fixed admin-set rate** via env var `AIC_USDC_RATE` — simplest for early rollout

For early rollout, use option 3 with an env var. Graduate to TWAP once the liquidity pool is established.

#### 2.5.3 `src/lib/pricing.ts` — AIC cost conversion

```ts
/**
 * Convert a USDC cost to AIC using the current exchange rate.
 * `aicPerUsdc` is how many AIC equal 1 USDC (e.g. 10 means $0.10/AIC).
 */
export function usdcToAic(usdcAmount: number, aicPerUsdc: number): number {
  return usdcAmount * aicPerUsdc;
}

/**
 * Convert human-readable AIC to on-chain 18-decimal bigint.
 */
export function aicToOnChainAmount(aic: number): bigint {
  return BigInt(Math.round(aic * 1e18));
}
```

#### 2.5.4 `src/lib/x402.ts` — dual-asset payment requirement

`buildPaymentRequiredResponse` currently hardcodes USDC. Extend it to emit two entries in `accepts[]` — one for USDC, one for AIC — so clients can pick their preferred payment token:

```ts
// If AIC config is available, add a second accepted payment:
accepts: [
  {
    scheme: "exact",
    network,
    asset: usdcConfig.address,
    amount: usdcAmountOnChain.toString(),
    payTo: env.RECEIVER_ADDRESS,
    maxTimeoutSeconds: 60,
    extra: { name: "USD Coin", version: "2" },
  },
  // Only if AIC payment is enabled:
  ...(aicConfig ? [{
    scheme: "exact",
    network,
    asset: aicConfig.tokenAddress,
    amount: aicAmountOnChain.toString(),
    payTo: env.RECEIVER_ADDRESS,
    maxTimeoutSeconds: 60,
    extra: { name: "WebAI3 Token", version: "1" },
  }] : []),
],
```

The client picks `accepts[0]` (USDC) or `accepts[1]` (AIC) depending on user preference. The server verifies whichever asset was used and records the token type in the `inferences` table.

#### 2.5.5 Database schema addition

```ts
paymentToken: text("payment_token").notNull().default("USDC"),
// Values: "USDC" | "AIC"
```

#### 2.5.6 Client hook: payment token selection

Add a `paymentToken` preference (stored in component state or a `usePaymentPreference` hook). Pass this to `useX402Payment` so it selects the correct entry from `accepts[]` and signs the correct EIP-712 domain (`WebAI3 Token` instead of `USD Coin`).

#### 2.5.7 UI: payment selection

In `src/components/inference/payment-confirm-dialog.tsx`, add a toggle:

```
Pay with:   [USDC]  [AIC]
Cost:       $0.0080 USDC  ←→  800.00 AIC  (at $0.10/AIC)
Balance:    12.40 USDC        23,500 AIC
```

If the user selects AIC but has insufficient balance, disable the confirm button and show a "get AIC" link.

---

## 3. Tier 2 — Burn-on-Use + Access Gating

### 3.1 Overview

Tier 2 transforms AIC from a discount vehicle into a structural component of the platform economy:

1. **Burn-on-use**: A percentage of AIC paid for inference is burned (removed from supply), creating deflationary pressure tied directly to platform usage.
2. **Access gating**: Certain model tiers or higher request limits are only available to users who hold/stake a minimum AIC threshold.

### 3.2 Burn-on-Use

#### 3.2.1 How burning works

When a user pays in AIC (Tier 1.2.5), the server splits the AIC payment:
- A configurable portion (e.g., 20%) is sent to `address(0)` (burned)
- The remainder goes to `RECEIVER_ADDRESS` (platform treasury)

This requires the settlement path to support split destinations, or alternatively a smart contract `PaymentSplitter` that receives AIC and executes the burn + treasury transfer atomically.

**Recommended approach**: Deploy a `AICSplitter.sol` contract:

```solidity
contract AICSplitter {
    address public immutable treasury;
    uint256 public immutable burnBps;  // basis points, e.g. 2000 = 20%

    constructor(address treasury_, uint256 burnBps_) {
        treasury = treasury_;
        burnBps  = burnBps_;
    }

    /// @notice Receive AIC, burn `burnBps`%, send the rest to treasury.
    function split(IERC20Burnable token, uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        uint256 burnAmount     = amount * burnBps / 10_000;
        uint256 treasuryAmount = amount - burnAmount;
        token.burn(burnAmount);
        token.transfer(treasury, treasuryAmount);
    }
}
```

> **Note:** This requires adding a `burn(uint256)` function to `WebAI3Token`. The current contract does not expose burn. This is a contract upgrade (new deployment, not in-place modification since the contract is immutable by design). A wrapper contract pattern is the cleanest approach without breaking the fixed-supply invariant promise — burn replaces supply reduction at the token level rather than "minting" never-issued tokens.

The `RECEIVER_ADDRESS` env var should be updated to point to the splitter contract address instead of the treasury wallet directly.

#### 3.2.2 Tracking burns

Add to the `inferences` table:

```ts
aicBurnedAmount: numeric("aic_burned_amount", { precision: 30, scale: 18 }),
```

Also expose a `/api/stats` aggregate for total AIC burned — useful for the landing page and governance dashboards.

#### 3.2.3 Burn rate configuration

Burn percentage should be configurable, not hardcoded. Initial approach: `AIC_BURN_BPS` env var (integer 0–10000). Future: put it on-chain and let AIC governance vote to change it (this is the governance utility of `ERC20Votes`).

### 3.3 Access Gating

#### 3.3.1 Model tiers

Not all Replicate models should be equally accessible. Define three tiers:

| Tier | AIC required | Examples |
|---|---|---|
| Free | 0 AIC (any user) | Base Stable Diffusion, small LLMs |
| Standard | ≥ 500 AIC held | Mid-range diffusion, mid-size LLMs |
| Premium | ≥ 5,000 AIC staked | SDXL, large LLMs, high-quality audio models |

"Held" means raw wallet balance (`balanceOf`). "Staked" means staked in the `AICStak` contract. Premium gating uses staked balance specifically, as it signals longer-term commitment.

#### 3.3.2 `src/types/task-config.ts` — add tier to model definition

The `TASK_CONFIGS` map defines task-level metadata. Model-level tiers require a model registry. Extend `src/lib/model-discovery.ts`:

```ts
export type ModelTier = "free" | "standard" | "premium";

export interface ModelMeta {
  id: string;           // e.g. "stability-ai/sdxl"
  task: TaskType;
  tier: ModelTier;
  label: string;
  // ... existing fields
}

// Hardcoded tier assignments (or fetched from a CMS / config file):
export const MODEL_TIERS: Record<string, ModelTier> = {
  "stability-ai/stable-diffusion": "free",
  "stability-ai/sdxl":             "premium",
  "meta/llama-2-7b-chat":          "standard",
  "meta/llama-2-70b-chat":         "premium",
  // ...
};

export function modelTier(modelId: string): ModelTier {
  return MODEL_TIERS[modelId] ?? "standard";
}
```

#### 3.3.3 `src/lib/access.ts` — gating logic (new file)

```ts
import { ModelTier } from "@/lib/model-discovery";

const TIER_REQUIREMENTS: Record<ModelTier, { heldAic: number; stakedAic: number }> = {
  free:     { heldAic: 0,     stakedAic: 0     },
  standard: { heldAic: 500,   stakedAic: 0     },
  premium:  { heldAic: 0,     stakedAic: 5_000 },
};

export function hasAccess(
  tier: ModelTier,
  heldAic: number,
  stakedAic: number
): boolean {
  const req = TIER_REQUIREMENTS[tier];
  return heldAic >= req.heldAic && stakedAic >= req.stakedAic;
}
```

#### 3.3.4 `src/app/api/inference/route.ts` — enforce gating

After reading `stakedAic` (Tier 1 step 2.4.6), also read the wallet `balanceOf` for held AIC (use the same public client). Then check access:

```ts
const tier = modelTier(model);
if (!hasAccess(tier, heldAic, stakedAic)) {
  return NextResponse.json(
    {
      error: `Model "${model}" requires ${TIER_REQUIREMENTS[tier].stakedAic > 0
        ? `${TIER_REQUIREMENTS[tier].stakedAic.toLocaleString()} AIC staked`
        : `${TIER_REQUIREMENTS[tier].heldAic.toLocaleString()} AIC in wallet`}.`,
      code: "INSUFFICIENT_AIC",
      required: TIER_REQUIREMENTS[tier],
    },
    { status: 403 }
  );
}
```

#### 3.3.5 `src/app/api/models/route.ts` — annotate models with tier

Return `tier` on each model in the model list. The client uses this to render lock icons and requirement badges in the model selector.

#### 3.3.6 Client enforcement (soft)

The server is the authoritative gate. The client should:
1. Show lock badges on premium/standard models if the user doesn't qualify
2. Disable the "Run" button with a tooltip explaining the requirement
3. Never assume access from client-side state alone (server will reject anyway)

`src/hooks/use-models.ts` should accept the user's AIC balances and annotate each model with `{ ...model, tier, userHasAccess: boolean }`.

#### 3.3.7 Rate limit tiers

In addition to model access, gating can apply to request frequency. Extend `src/lib/rate-limit.ts`:

```ts
const RATE_LIMITS: Record<ModelTier | "default", { windowMs: number; max: number }> = {
  default:  { windowMs: 60_000, max: 5  },  // 5 req/min for free users
  free:     { windowMs: 60_000, max: 5  },
  standard: { windowMs: 60_000, max: 20 },
  premium:  { windowMs: 60_000, max: 60 },
};
```

The user's effective rate limit tier is derived from their highest qualifying model tier.

---

## 4. Summary of Changes by Layer

| Layer | Tier 1 Discount | Tier 1 AIC Payment | Tier 2 Burn | Tier 2 Gating |
|---|---|---|---|---|
| Smart contracts | New staking contract | AIC needs EIP-3009 or Option A | New splitter contract + burn on token | — |
| `src/lib/contracts.ts` | AIC + staking addresses | — | Splitter address | — |
| `src/lib/pricing.ts` | `discountMultiplier`, `discountedRate` | `usdcToAic`, `aicToOnChainAmount` | — | — |
| `src/lib/staking.ts` | New — server-side balance read | — | — | Held AIC read |
| `src/lib/x402.ts` | — | Dual-asset `accepts[]` | — | — |
| `src/lib/access.ts` | — | — | — | New — `hasAccess` |
| `src/lib/model-discovery.ts` | — | — | — | `ModelTier`, `MODEL_TIERS` |
| `src/lib/rate-limit.ts` | — | — | — | Tier-based limits |
| `src/lib/server-env.ts` | AIC_STAKING_ADDRESS | AIC_TOKEN_ADDRESS, AIC_USDC_RATE | AIC_BURN_BPS | — |
| `src/lib/env.ts` | NEXT_PUBLIC_AIC_STAKING_ADDRESS | NEXT_PUBLIC_AIC_TOKEN_ADDRESS | — | — |
| `src/lib/db/schema.ts` | stakedAicAtTime, discountPct, effectiveRateUsdc | paymentToken | aicBurnedAmount | — |
| `src/app/api/inference/route.ts` | Apply discount | Accept AIC header | Split/burn | Enforce gating |
| `src/app/api/inference/estimate/route.ts` | Return discountPct | Return AIC equivalent | — | Return model tier |
| `src/app/api/models/route.ts` | — | — | — | Annotate with tier |
| `src/hooks/use-aic-staking.ts` | New hook | — | — | — |
| `src/hooks/use-wallet-balances.ts` | Add AIC balance | — | — | — |
| `src/hooks/use-models.ts` | — | — | — | Annotate with access |
| `src/components/inference/cost-estimate.tsx` | Show discount badge | Show AIC cost option | — | — |
| `src/components/inference/payment-confirm-dialog.tsx` | — | Token toggle | — | — |
| `src/components/inference/model-selector.tsx` | — | — | — | Lock badges |

---

## 5. Environment Variable Reference (complete after integration)

### Client (`src/lib/env.ts`)
```
NEXT_PUBLIC_BASE_RPC_URL
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
NEXT_PUBLIC_ENABLE_DEV_CHAIN
NEXT_PUBLIC_AIC_TOKEN_ADDRESS        # Tier 1 — AIC token address on Base
NEXT_PUBLIC_AIC_STAKING_ADDRESS      # Tier 1 — staking contract address on Base
```

### Server (`src/lib/server-env.ts`)
```
REPLICATE_API_TOKEN
DATABASE_URL
SESSION_SECRET
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
RECEIVER_ADDRESS                     # Treasury or splitter contract address
INFERENCE_RATE_PER_SEC               # Base rate, default 0.001
X402_FACILITATOR_URL
ADMIN_ADDRESSES
AIC_TOKEN_ADDRESS                    # Tier 1 — for server-side balance reads
AIC_STAKING_ADDRESS                  # Tier 1 — for server-side staked balance reads
AIC_USDC_RATE                        # Tier 1 — AIC per 1 USDC (e.g. "10" = $0.10/AIC)
AIC_BURN_BPS                         # Tier 2 — basis points burned on AIC payment, e.g. "2000"
```

---

## 6. Recommended Implementation Order

1. Deploy the AIC staking contract (prerequisite for everything)
2. Implement discount tiers in `pricing.ts` + server-side staking read (Tier 1.2)
3. Show AIC balance + stake info in the wallet UI
4. Add model tier annotations + client-side lock UI (Tier 2 gating — UI only, no enforcement yet)
5. Deploy on testnet, validate discount math with real staked balances
6. Enforce gating server-side once tier assignments are finalized
7. Extend `WebAI3Token` (or deploy wrapper) with EIP-3009 support for AIC payments (Tier 1.5)
8. Update x402 flow to support dual-asset `accepts[]` and AIC signing on client
9. Deploy splitter contract, wire `AIC_BURN_BPS` (Tier 2 burn)
10. Add `aicBurnedAmount` to stats API and surface on landing page / dashboard
