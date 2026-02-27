# webai3 — Pay-Per-Use AI Inference on Web3

A Web3-native AI inference platform where users authenticate with their Ethereum wallet and run AI models on demand. No subscriptions, no accounts — connect your wallet, run a model, pay only for what you use.

Built on **Base** (Coinbase's L2), powered by **Replicate** for model execution, and **Cloudflare R2** for media storage.

---

## Goals

- **Permissionless access** — any Ethereum wallet can use the platform without signing up or providing personal data.
- **Pay-per-use model** — users pay per inference rather than committing to a subscription. Billing is tied to on-chain identity.
- **Multi-modal AI** — support text-to-image, text-to-text, and text-to-sound tasks through a unified interface.
- **Persistent history** — every inference is recorded and retrievable, with media files stored durably in R2.
- **Model selection** — users choose from real Replicate-hosted models filtered by task type, not a locked-in single model.

---

## Features

| Feature | Description |
|---|---|
| Wallet authentication | Sign-In With Ethereum (SIWE / EIP-4361) — no passwords |
| Text to Image | Generate images from prompts using diffusion models |
| Text to Text | Generate, summarize, or transform text with language models |
| Text to Sound | Generate music, effects, or speech from text descriptions |
| Model selector | Browse top Replicate models per task |
| Inference history | Full history of past runs with result replay |
| Media persistence | Images and audio uploaded to Cloudflare R2 with presigned URLs |
| USDC balance display | Native ETH + USDC balance on Base visible in the wallet panel |

---

## Architecture

```
Browser
  │
  ├── Wagmi + viem          → wallet connection, signing
  ├── SIWE                  → wallet-based authentication
  ├── TanStack React Query  → server state, caching, mutations
  └── shadcn/ui + Tailwind  → UI components and styling
         │
         ▼
  Next.js (App Router)
  ├── /app/api/auth/*       → nonce, verify, session, logout
  ├── /app/api/inference    → run a model via Replicate
  ├── /app/api/inferences   → list + detail endpoints
  └── /app/api/models       → fetch available models from Replicate
         │
         ├── iron-session        → encrypted HTTP-only session cookie
         ├── Drizzle ORM         → type-safe PostgreSQL queries
         ├── Replicate SDK       → model execution
         └── AWS S3 SDK (R2)     → media upload and presigned URLs
```

### Inference pipeline

```
POST /api/inference
  1. Verify session (iron-session) → 401 if unauthenticated
  2. Validate request body (Zod)   → 400 on schema error
  3. Run model via Replicate SDK
  4a. Text output  → store in DB (outputData jsonb)
  4b. Media output → download → upload to R2 → generate presigned URL
  5. Insert inference record into PostgreSQL
  6. Return { id, output, status, metrics }
```

### Authentication flow

```
1. GET  /api/auth/nonce    → server generates nonce, stores in session
2. Client signs SIWE message with wallet (wagmi signMessageAsync)
3. POST /api/auth/verify   → verify signature, upsert user, save address to session
4. GET  /api/auth/session  → read current session on page load
5. POST /api/auth/logout   → destroy session
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Geist font |
| Web3 | Wagmi v2, viem, SIWE |
| Server state | TanStack React Query v5 |
| Validation | Zod |
| Database | PostgreSQL + Drizzle ORM |
| Auth sessions | iron-session |
| AI models | Replicate API |
| Media storage | Cloudflare R2 (S3-compatible) |
| Testing | Vitest, Testing Library, jsdom |
| Networks | Base Mainnet (8453), Base Sepolia (84532) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (Web3Provider wrapper)
│   ├── page.tsx                   # Landing page (Server Component)
│   ├── api/
│   │   ├── auth/                  # nonce · verify · session · logout
│   │   ├── inference/             # POST — run inference
│   │   ├── inferences/            # GET list, GET [id]
│   │   └── models/                # GET available models
│   ├── inference/
│   │   ├── page.tsx               # Task selector
│   │   ├── text-to-image/
│   │   ├── text-to-text/
│   │   └── text-to-sound/
│   └── history/
│       ├── page.tsx
│       └── [id]/page.tsx
├── components/
│   ├── ui/                        # shadcn/ui primitives (auto-generated)
│   ├── layout/                    # site-header, site-footer
│   ├── auth/                      # sign-in-button
│   ├── wallet/                    # wallet-button, wallet-details, connect-dialog
│   ├── inference/                 # form, result, loading, model-selector
│   ├── history/                   # inference-history
│   └── sections/                  # landing page sections
├── hooks/
│   ├── use-auth.ts                # SIWE auth flow
│   ├── use-inference.ts           # run model mutation
│   ├── use-models.ts              # fetch available models
│   ├── use-inference-history.ts   # paginated history
│   ├── use-inference-detail.ts    # single inference
│   └── use-wallet-balances.ts     # ETH + USDC balance
├── lib/
│   ├── db/
│   │   ├── index.ts               # Drizzle instance
│   │   └── schema.ts              # users, inferences tables + enums
│   ├── wagmi.ts                   # chain config (Base + Base Sepolia)
│   ├── contracts.ts               # USDC contract addresses
│   ├── session.ts                 # iron-session config
│   ├── replicate.ts               # Replicate SDK singleton
│   ├── r2.ts                      # R2 upload + presigned URL helpers
│   ├── auth.ts                    # requireAuth helper
│   ├── env.ts                     # client env validation (Zod)
│   ├── server-env.ts              # server env validation (Zod)
│   └── utils.ts                   # cn() class utility
├── providers/
│   └── web3-provider.tsx          # WagmiProvider + QueryClientProvider
└── types/
    ├── inference.ts               # Zod schemas + inferred types
    └── task-config.ts             # TASK_CONFIGS map (single source of truth)
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database
- [Replicate](https://replicate.com) API token
- [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket + credentials

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# ── Client-side (exposed to browser) ──────────────────────────────────────────
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# ── Server-side (never exposed to browser) ────────────────────────────────────

# Replicate
REPLICATE_API_TOKEN=r8_...

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/webai3

# iron-session — must be at least 32 random characters
SESSION_SECRET=your_32_plus_character_random_secret_here

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
```

All server variables are validated with Zod on startup. The app will throw a clear error message listing any missing ones.

### 3. Set up the database

```bash
# Generate migration files from schema
pnpm db:generate

# Apply migrations to the database
pnpm db:migrate
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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
| `task_type` | enum | `text-to-image` · `text-to-text` · `text-to-sound` |
| `model` | text | Replicate model identifier (`owner/name`) |
| `input` | jsonb | Raw input parameters sent to the model |
| `output_type` | enum | `text` · `image` · `audio` |
| `output_data` | jsonb | Text output (stored directly) |
| `r2_keys` | jsonb | R2 object keys for media output |
| `status` | enum | `pending` · `succeeded` · `failed` |
| `error_message` | text | Failure reason (if failed) |
| `predict_time_ms` | integer | End-to-end Replicate execution time |
| `created_at` | timestamptz | Inference timestamp |

---

## API Reference

All endpoints return JSON. Errors follow the shape `{ error: string, code: string }`.

### Auth

| Method | Path | Auth required | Description |
|---|---|---|---|
| `GET` | `/api/auth/nonce` | No | Generate a SIWE nonce |
| `POST` | `/api/auth/verify` | No | Verify signature, create session |
| `GET` | `/api/auth/session` | No | Read current session |
| `POST` | `/api/auth/logout` | Yes | Destroy session |

### Models

| Method | Path | Auth required | Description |
|---|---|---|---|
| `GET` | `/api/models?task=<task>` | No | List top Replicate models for a task type |

`task` values: `text-to-image`, `text-to-text`, `text-to-sound`

### Inference

| Method | Path | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/inference` | Yes | Run a model |
| `GET` | `/api/inferences?page=1&limit=20` | Yes | Paginated history |
| `GET` | `/api/inferences/[id]` | Yes | Single inference detail |

**POST `/api/inference` request body:**

```json
{
  "model": "owner/model-name",
  "task": "text-to-image",
  "input": {
    "prompt": "A futuristic cityscape at sunset",
    "num_outputs": 1
  }
}
```

**Response:**

```json
{
  "id": "uuid",
  "output": "https://r2.example.com/presigned-url...",
  "status": "succeeded",
  "metrics": { "predictTimeMs": 4200 }
}
```

---

## Scripts

```bash
pnpm dev            # Start development server
pnpm build          # Production build
pnpm start          # Start production server
pnpm lint           # ESLint
pnpm test           # Run tests (Vitest, single pass)
pnpm test:watch     # Run tests in watch mode

pnpm db:generate    # Generate Drizzle migration from schema changes
pnpm db:migrate     # Apply pending migrations
pnpm db:push        # Push schema directly (dev only, skips migrations)
pnpm db:studio      # Open Drizzle Studio (database browser)

pnpm dlx shadcn add <component>   # Add a new shadcn/ui component
```

---

## Testing

Tests use **Vitest** with **Testing Library** and **jsdom**.

```bash
pnpm test           # CI — single run, passes with no tests
pnpm test:watch     # Development — watch mode
```

Test files are colocated with the module they test:

```
src/hooks/use-inference.ts
src/hooks/use-inference.test.ts
```

---

## Deployment

The app is a standard Next.js application and can be deployed to any Node.js host (Vercel, Railway, Fly.io, etc.).

Required before deploying:

1. Set all environment variables from the [configuration section](#2-configure-environment-variables) in your host's secrets manager.
2. Ensure `DATABASE_URL` points to a production PostgreSQL instance.
3. Run `pnpm db:migrate` against the production database as part of the deploy step.
4. Confirm your R2 bucket CORS policy allows requests from your production domain.
5. Set `SESSION_SECRET` to a securely generated random string (minimum 32 characters).
