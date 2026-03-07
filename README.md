# web3-ai — Pay-Per-Use AI Inference on Web3

A Web3-native AI inference platform where users authenticate with their Ethereum wallet and pay per inference using USDC via the [x402 payment protocol](https://www.x402.org/). No subscriptions, no accounts — connect your wallet, run a model, pay only for what you use.

Built on **Base** (Coinbase L2), powered by **Replicate** for model execution, **Cloudflare R2** for permanent media storage, and **x402** for trustless USDC payments.

---

## Features

| Feature | Description |
|---|---|
| Wallet authentication | Sign-In With Ethereum (SIWE / EIP-4361) — no passwords |
| x402 USDC payments | Pay-per-inference with USDC on Base via Coinbase x402 facilitator |
| Settlement before compute | Payment is settled on-chain before inference runs — no free rides |
| Cost estimation | Upfront cost estimates before running a model |
| Text to Image | Generate images from prompts using diffusion models |
| Text to Text | Generate, summarize, or transform text with language models |
| Text to Sound | Generate music, effects, or speech from text descriptions |
| Prompt templates | 16 curated templates across all task types for quick starts |
| Public gallery | Browse and share creations with permalink pages and OG metadata |
| Model selector | Browse top Replicate models per task type |
| Inference history | Full history of past runs with result replay |
| Share toggle | Make any inference public/private with one click, copy share link |
| User dashboard | Personal stats — total inferences, spend, usage breakdown |
| Admin dashboard | Platform-wide metrics and usage monitoring |
| Permanent media storage | Images and audio stored on Cloudflare R2 with permanent public URLs |
| USDC balance display | ETH + USDC balance on Base visible in the wallet panel |
| On-chain receipts | Every inference has a settlement transaction hash for transparency |
| Local dev chain | Anvil fork of Base Sepolia for local development |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Geist font |
| Web3 | Wagmi v2, viem, SIWE |
| Payments | x402 protocol (EIP-3009 transferWithAuthorization), USDC on Base |
| Server state | TanStack React Query v5 |
| Validation | Zod |
| Database | PostgreSQL + Drizzle ORM |
| Auth sessions | iron-session (encrypted HTTP-only cookies) |
| AI models | Replicate API |
| Media storage | Cloudflare R2 (S3-compatible, public bucket) |
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
│   │   ├── inferences/               # GET list, GET/PATCH [id]
│   │   ├── models/                   # GET available models from Replicate
│   │   ├── gallery/                  # GET public gallery (paginated)
│   │   ├── r/[id]/                   # GET public permalink for shared inference
│   │   ├── stats/                    # GET platform-wide stats
│   │   ├── user/stats/               # GET per-user stats
│   │   └── admin/metrics/            # GET admin metrics (protected)
│   ├── inference/
│   │   ├── page.tsx                  # Task selector
│   │   ├── text-to-image/
│   │   ├── text-to-text/
│   │   └── text-to-sound/
│   ├── gallery/page.tsx              # Public gallery browser
│   ├── templates/page.tsx            # Prompt templates browser
│   ├── r/[id]/page.tsx               # Public permalink page (OG metadata)
│   └── history/
│       ├── page.tsx
│       └── [id]/page.tsx             # Detail view with share toggle
├── components/
│   ├── ui/                           # shadcn/ui primitives (auto-generated)
│   ├── layout/                       # site-header (mobile menu), site-footer
│   ├── auth/                         # sign-in-button
│   ├── wallet/                       # wallet-button, wallet-details, connect-dialog
│   ├── inference/                    # form, results, loading, model-selector,
│   │                                 # cost-estimate, payment-confirm-dialog,
│   │                                 # task-card, inference-page-layout
│   ├── gallery/                      # gallery-grid, public-result-view
│   ├── templates/                    # template-grid
│   ├── dashboard/                    # user-dashboard
│   ├── admin/                        # admin-dashboard
│   ├── history/                      # inference-history, inference-history-card
│   └── sections/                     # landing page: hero, showcase, how-it-works,
│                                     # features, pricing, templates, cta
├── hooks/
│   ├── use-auth.ts                   # SIWE auth flow
│   ├── use-inference.ts              # Run model mutation
│   ├── use-models.ts                 # Fetch available models
│   ├── use-cost-estimate.ts          # Pre-inference cost estimate
│   ├── use-x402-payment.ts           # x402 USDC payment flow
│   ├── use-inference-history.ts      # Paginated history
│   ├── use-inference-detail.ts       # Single inference detail
│   ├── use-gallery.ts                # Public gallery data
│   ├── use-share-inference.ts        # Toggle public/private mutation
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
│   ├── templates.ts                  # Prompt template definitions (16 templates)
│   ├── model-discovery.ts            # Replicate model discovery
│   ├── inference-utils.ts            # Inference processing utilities
│   ├── inference-error.ts            # Structured inference error handling
│   ├── wagmi.ts                      # Chain config (Base, Base Sepolia, Anvil)
│   ├── contracts.ts                  # USDC contract addresses per chain
│   ├── session.ts                    # iron-session config
│   ├── replicate.ts                  # Replicate SDK singleton
│   ├── r2.ts                         # R2 upload + public URL helpers
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
1. Client sends POST /api/inference (no payment header)
2. Server returns 402 with Payment-Required header (estimated cost)
3. Client signs USDC transferWithAuthorization via wallet (EIP-3009)
4. Client resends request with Payment-Signature header
5. Server verifies signature with x402 facilitator
6. Server settles payment on-chain (USDC transferred)         ← before inference
7. Server runs inference via Replicate                         ← after settlement
8. Server uploads media to R2 (if applicable), stores record in DB
9. Server returns result with Payment-Response header
```

Settlement happens **before** inference — if payment fails, no compute runs. If inference fails after settlement, the failure is recorded with the payment transaction hash for auditability.

### Inference pipeline

```
POST /api/inference
  Phase 1 — No payment header:
    → Return 402 with Payment-Required header (estimated cost in USDC)

  Phase 2 — Has Payment-Signature header:
    1. Decode + validate payment payload                    → 400 if malformed
    2. Rebuild payment requirement from estimated cost
    3. Verify with x402 facilitator                         → 402 if invalid
    4. Settle payment on-chain via x402 facilitator         → 402 if settlement fails
    5. Run model via Replicate SDK
    6a. Text output  → store in DB (outputData jsonb)
    6b. Media output → download → upload to R2 → return permanent public URL
    7. Insert inference record into PostgreSQL
    8. Return { id, output, status, metrics } + Payment-Response header
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
- [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket with public access enabled
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
| `R2_PUBLIC_URL` | Public URL for the R2 bucket (e.g. `https://pub-xxxx.r2.dev`) |
| `RECEIVER_ADDRESS` | Ethereum address that receives USDC payments |

Optional server-side variables:

| Variable | Default | Description |
|---|---|---|
| `INFERENCE_RATE_PER_SEC` | `0.001` | USDC cost per second of Replicate execution time |
| `X402_FACILITATOR_URL` | `https://www.x402.org/facilitator` | x402 facilitator endpoint (testnet) |
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

Set `NEXT_PUBLIC_ENABLE_DEV_CHAIN=true` in `.env.local` to enable the local chain in the UI. Note: the x402 facilitator does not support local Anvil chains — payment settlement is mocked with random transaction hashes. Use Base Sepolia for testing real payments end-to-end.

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
| `is_public` | integer | `0` = private (default), `1` = visible in gallery |
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
| `PATCH` | `/api/inferences/[id]` | Yes | Toggle `isPublic` (owner only) |

### Gallery & Sharing

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/gallery?page=1&limit=20&task=<task>` | No | Public gallery (paginated, filterable) |
| `GET` | `/api/r/[id]` | No | Public permalink for a shared inference |

### Stats

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/stats` | No | Platform-wide aggregate stats |
| `GET` | `/api/user/stats` | Yes | Per-user usage stats |
| `GET` | `/api/admin/metrics` | Admin | Admin-only platform metrics |

---

## Pages

| Path | Description |
|---|---|
| `/` | Landing page (hero, showcase, how-it-works, features, pricing, templates, CTA) |
| `/inference` | Task selector |
| `/inference/text-to-image` | Image generation (supports URL param pre-fill from templates) |
| `/inference/text-to-text` | Text generation |
| `/inference/text-to-sound` | Audio generation |
| `/templates` | Browse 16 curated prompt templates with task-type filter |
| `/gallery` | Public gallery with filterable grid (all/images/text/audio) |
| `/r/[id]` | Public permalink page with OG metadata for social unfurling |
| `/dashboard` | User dashboard with stats |
| `/history` | Inference history list |
| `/history/[id]` | Inference detail with share toggle + copy link |
| `/admin` | Admin panel (protected) |

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

## Deployment

The app is a standard Next.js application deployable to any Node.js host (Vercel, Railway, Fly.io, etc.).

Required before deploying:

1. Set all environment variables from the [configuration section](#2-configure-environment-variables) in your host's secrets manager.
2. Ensure `DATABASE_URL` points to a production PostgreSQL instance.
3. Run `pnpm db:migrate` against the production database as part of the deploy step.
4. Confirm your R2 bucket has public access enabled and CORS allows requests from your production domain.
5. Set `SESSION_SECRET` to a securely generated random string (minimum 32 characters).
6. Set `RECEIVER_ADDRESS` to the production wallet that should receive USDC payments.
7. Set `X402_FACILITATOR_URL` to the mainnet facilitator: `https://api.cdp.coinbase.com/platform/v2/x402`.
