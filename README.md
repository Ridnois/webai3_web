# webai3 — Pay-Per-Use AI Inference on Web3

A Web3-native AI inference platform where users authenticate with their Ethereum wallet and pay per inference using USDC via the [x402 payment protocol](https://www.x402.org/). No subscriptions, no accounts — connect your wallet, run a model, pay only for what you use.

Built on **Base** (Coinbase L2), powered by **Replicate** for model execution, **Cloudflare R2** for media storage, and **x402** for trustless USDC payments.

---

## Features

| Feature | Description |
|---|---|
| Wallet authentication | Sign-In With Ethereum (SIWE / EIP-4361) — no passwords |
| x402 USDC payments | Pay-per-inference with USDC on Base via Coinbase x402 facilitator |
| Cost estimation | Upfront cost estimates before running a model |
| Text to Image | Generate images from prompts using diffusion models |
| Text to Text | Generate, summarize, or transform text with language models |
| Text to Sound | Generate music, effects, or speech from text descriptions |
| Model selector | Browse top Replicate models per task type |
| Inference history | Full history of past runs with result replay |
| User dashboard | Personal stats — total inferences, spend, usage breakdown |
| Admin dashboard | Platform-wide metrics and usage monitoring |
| Media persistence | Images and audio uploaded to Cloudflare R2 with presigned URLs |
| USDC balance display | ETH + USDC balance on Base visible in the wallet panel |
| Local dev chain | Anvil fork of Base Sepolia for local development |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Geist font |
| Web3 | Wagmi v2, viem, SIWE |
| Payments | x402 protocol, USDC on Base |
| Server state | TanStack React Query v5 |
| Validation | Zod |
| Database | PostgreSQL + Drizzle ORM |
| Auth sessions | iron-session |
| AI models | Replicate API |
| Media storage | Cloudflare R2 (S3-compatible) |
| Testing | Vitest, Testing Library, jsdom |
| Package manager | pnpm |
| Networks | Base Mainnet (8453), Base Sepolia (84532), Anvil local (31337) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (Web3Provider + AuthProvider)
│   ├── page.tsx                      # Landing page (Server Component)
│   ├── dashboard/page.tsx            # User dashboard — personal stats
│   ├── admin/page.tsx                # Admin dashboard — platform metrics
│   ├── api/
│   │   ├── auth/                     # nonce · verify · session · logout
│   │   ├── inference/
│   │   │   ├── route.ts              # POST — run a model (x402 payment)
│   │   │   └── estimate/route.ts     # POST — cost estimate before payment
│   │   ├── inferences/               # GET list, GET [id]
│   │   ├── models/                   # GET available models from Replicate
│   │   ├── stats/                    # GET platform-wide stats
│   │   ├── user/stats/               # GET per-user stats
│   │   └── admin/metrics/            # GET admin metrics (protected)
│   ├── inference/
│   │   ├── page.tsx                  # Task selector
│   │   ├── text-to-image/
│   │   ├── text-to-text/
│   │   └── text-to-sound/
│   └── history/
│       ├── page.tsx
│       └── [id]/page.tsx
├── components/
│   ├── ui/                           # shadcn/ui primitives (auto-generated)
│   ├── layout/                       # site-header, site-footer
│   ├── auth/                         # sign-in-button
│   ├── wallet/                       # wallet-button, wallet-details, connect-dialog
│   ├── inference/                    # form, results, loading, model-selector,
│   │                                 # cost-estimate, payment-confirm-dialog,
│   │                                 # task-card, inference-page-layout
│   ├── dashboard/                    # user-dashboard
│   ├── admin/                        # admin-dashboard
│   ├── history/                      # inference-history, inference-history-card
│   └── sections/                     # landing page: hero, features, how-it-works,
│                                     # stats, cta
├── hooks/
│   ├── use-auth.ts                   # SIWE auth flow
│   ├── use-inference.ts              # Run model mutation
│   ├── use-models.ts                 # Fetch available models
│   ├── use-cost-estimate.ts          # Pre-inference cost estimate
│   ├── use-x402-payment.ts           # x402 USDC payment flow
│   ├── use-inference-history.ts      # Paginated history
│   ├── use-inference-detail.ts       # Single inference detail
│   ├── use-wallet-balances.ts        # ETH + USDC balance
│   ├── use-user-stats.ts             # Per-user usage stats
│   ├── use-platform-stats.ts         # Platform-wide stats
│   └── use-admin-metrics.ts          # Admin metrics
├── lib/
│   ├── db/
│   │   ├── index.ts                  # Drizzle instance
│   │   └── schema.ts                 # users, inferences tables + enums
│   ├── x402.ts                       # x402 payment protocol helpers
│   ├── pricing.ts                    # Cost estimation + USDC conversion
│   ├── model-discovery.ts            # Replicate model discovery
│   ├── inference-utils.ts            # Inference processing utilities
│   ├── inference-error.ts            # Structured inference error handling
│   ├── wagmi.ts                      # Chain config (Base, Base Sepolia, Anvil)
│   ├── contracts.ts                  # USDC contract addresses per chain
│   ├── session.ts                    # iron-session config
│   ├── replicate.ts                  # Replicate SDK singleton
│   ├── r2.ts                         # R2 upload + presigned URL helpers
│   ├── auth.ts                       # requireAuth helper
│   ├── admin.ts                      # Admin authorization (requireAdmin)
│   ├── env.ts                        # Client env validation (Zod)
│   ├── server-env.ts                 # Server env validation (Zod)
│   └── utils.ts                      # cn() class utility
├── providers/
│   ├── web3-provider.tsx             # WagmiProvider + QueryClientProvider
│   └── auth-provider.tsx             # Authentication context provider
└── types/
    ├── inference.ts                  # Zod schemas + inferred types
    └── task-config.ts                # TASK_CONFIGS map (single source of truth)
```

---

## Architecture

### Payment flow (x402)

```
1. User submits inference request
2. Client calls POST /api/inference/estimate → get USDC cost estimate
3. Payment confirmation dialog shown to user
4. Client signs USDC transfer via x402 (EIP-3009 transferWithAuthorization)
5. Server receives X-PAYMENT header with signed authorization
6. Server calls x402 facilitator /verify → validates payment signature
7. Server runs inference via Replicate
8. Server calls x402 facilitator /settle → executes USDC transfer on-chain
9. Server stores result + payment tx hash in DB
```

### Inference pipeline

```
POST /api/inference
  1. Verify session (iron-session)         → 401 if unauthenticated
  2. Decode + verify x402 payment header   → 402 if missing/invalid
  3. Validate request body (Zod)           → 400 on schema error
  4. Run model via Replicate SDK
  5a. Text output  → store in DB (outputData jsonb)
  5b. Media output → download → upload to R2 → generate presigned URL
  6. Settle payment via x402 facilitator   → on-chain USDC transfer
  7. Insert inference record into PostgreSQL (with payment details)
  8. Return { id, output, status, metrics, cost }
```

### Authentication flow (SIWE)

```
1. GET  /api/auth/nonce    → server generates nonce, stores in session
2. Client signs SIWE message with wallet (wagmi signMessageAsync)
3. POST /api/auth/verify   → verify signature, upsert user, save address to session
4. GET  /api/auth/session  → read current session on page load
5. POST /api/auth/logout   → destroy session
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database
- [Replicate](https://replicate.com) API token
- [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket + credentials
- An Ethereum wallet address to receive USDC payments

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

Required server-side variables:

| Variable | Description |
|---|---|
| `REPLICATE_API_TOKEN` | Replicate API token |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random string, min 32 characters |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `RECEIVER_ADDRESS` | Ethereum address that receives USDC payments |

Optional server-side variables:

| Variable | Default | Description |
|---|---|---|
| `INFERENCE_RATE_PER_SEC` | `0.001` | USDC cost per second of Replicate execution time |
| `X402_FACILITATOR_URL` | `https://www.x402.org/facilitator` | x402 facilitator endpoint (testnet) |
| `R2_PUBLIC_URL` | — | Public CDN URL for the R2 bucket |
| `ADMIN_ADDRESSES` | — | Comma-separated admin wallet addresses |

Optional client-side variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BASE_RPC_URL` | Custom Base Mainnet RPC (falls back to public) |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | Custom Base Sepolia RPC (falls back to public) |
| `NEXT_PUBLIC_ENABLE_DEV_CHAIN` | Set `true` to enable local Anvil chain (chainId 31337) |

All server variables are validated with Zod on startup — the app will throw listing any missing ones.

### 3. Set up the database

```bash
pnpm db:generate   # Generate migration files from schema
pnpm db:migrate    # Apply migrations to the database
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) Local dev chain

For local development without using Base Sepolia testnet:

```bash
pnpm chain:start   # Start Anvil fork of Base Sepolia
pnpm chain:fund    # Fund test wallets with USDC
```

Set `NEXT_PUBLIC_ENABLE_DEV_CHAIN=true` in `.env.local` to enable the local chain in the UI. Note: the x402 facilitator does not support local Anvil chains — use Base Sepolia for testing payments end-to-end.

---

## Database Schema

### `users`

| Column | Type | Description |
|---|---|---|
| `address` | text (PK) | Ethereum address (lowercase) |
| `created_at` | timestamptz | First sign-in |
| `last_seen_at` | timestamptz | Most recent sign-in |

### `inferences`

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `user_address` | text (FK) | Reference to `users.address` |
| `task_type` | enum | `text-to-image` / `text-to-text` / `text-to-sound` |
| `model` | text | Replicate model identifier (`owner/name`) |
| `input` | jsonb | Raw input parameters sent to the model |
| `output_type` | enum | `text` / `image` / `audio` |
| `output_data` | jsonb | Text output (stored directly) |
| `r2_keys` | jsonb | R2 object keys for media output |
| `status` | enum | `pending` / `succeeded` / `failed` |
| `error_message` | text | Failure reason (if failed) |
| `predict_time_ms` | integer | Replicate execution time |
| `estimated_cost_usdc` | numeric(18,6) | Pre-inference cost estimate |
| `actual_cost_usdc` | numeric(18,6) | Final cost based on actual execution time |
| `payment_tx_hash` | text (unique) | On-chain USDC payment transaction hash |
| `payment_chain_id` | integer | Chain the payment was made on |
| `created_at` | timestamptz | Inference timestamp |

---

## API Reference

All endpoints return JSON. Errors follow the shape `{ error: string, code: string }`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auth/nonce` | No | Generate a SIWE nonce |
| `POST` | `/api/auth/verify` | No | Verify signature, create session |
| `GET` | `/api/auth/session` | No | Read current session |
| `POST` | `/api/auth/logout` | Yes | Destroy session |

### Models

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/models?task=<task>` | No | List top Replicate models for a task type |

### Inference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/inference/estimate` | Yes | Get cost estimate for an inference |
| `POST` | `/api/inference` | Yes | Run a model (requires x402 payment header) |
| `GET` | `/api/inferences?page=1&limit=20` | Yes | Paginated history |
| `GET` | `/api/inferences/[id]` | Yes | Single inference detail |

### Stats

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/stats` | No | Platform-wide aggregate stats |
| `GET` | `/api/user/stats` | Yes | Per-user usage stats |
| `GET` | `/api/admin/metrics` | Admin | Admin-only platform metrics |

---

## Scripts

```bash
# Development
pnpm dev              # Start development server (localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint

# Testing
pnpm test             # Run tests (Vitest, single pass)
pnpm test:watch       # Run tests in watch mode

# Database
pnpm db:generate      # Generate Drizzle migration from schema changes
pnpm db:migrate       # Apply pending migrations
pnpm db:push          # Push schema directly (dev only, skips migrations)
pnpm db:studio        # Open Drizzle Studio (database browser)

# Local dev chain
pnpm chain:start      # Start Anvil fork of Base Sepolia
pnpm chain:fund       # Fund test wallets with USDC

# UI components
pnpm dlx shadcn add <component>   # Add a new shadcn/ui component
```

---

## Testing

Tests use **Vitest** with **Testing Library** and **jsdom**. Test files are colocated with the module they test:

```
src/lib/pricing.ts
src/lib/pricing.test.ts           ← doesn't exist yet, but this is the pattern

src/app/api/inference/route.ts
src/app/api/inference/route.test.ts
```

Existing test files:
- `src/app/api/inference/route.test.ts`
- `src/app/api/models/route.test.ts`
- `src/lib/inference-error.test.ts`
- `src/lib/inference-utils.test.ts`
- `src/lib/model-discovery.test.ts`
- `src/lib/x402.test.ts`
- `src/types/inference.test.ts`
- `src/types/task-config.test.ts`

---

## Deployment

The app is a standard Next.js application deployable to any Node.js host (Vercel, Railway, Fly.io, etc.).

Required before deploying:

1. Set all environment variables from the [configuration section](#2-configure-environment-variables) in your host's secrets manager.
2. Ensure `DATABASE_URL` points to a production PostgreSQL instance.
3. Run `pnpm db:migrate` against the production database as part of the deploy step.
4. Confirm your R2 bucket CORS policy allows requests from your production domain.
5. Set `SESSION_SECRET` to a securely generated random string (minimum 32 characters).
6. Set `RECEIVER_ADDRESS` to the production wallet that should receive USDC payments.
7. Set `X402_FACILITATOR_URL` to the mainnet facilitator: `https://api.cdp.coinbase.com/platform/v2/x402`.
