# CLAUDE.md — webai3_web

Web3-enabled AI inference platform. Users authenticate via wallet (SIWE), then pay-per-use to run AI models (text-to-image, text-to-text, text-to-sound) through the Replicate API. Payment is settled on-chain via x402 USDC before inference runs. Media outputs are stored permanently on Cloudflare R2 and indexed in PostgreSQL.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 + shadcn/ui (New York) |
| Web3 | Wagmi v2 + viem + SIWE (EIP-4361) |
| Payments | x402 protocol (EIP-3009 transferWithAuthorization) |
| Server State | TanStack React Query v5 |
| Database | PostgreSQL + Drizzle ORM |
| AI Models | Replicate API |
| Storage | Cloudflare R2 (S3-compatible, public bucket) |
| Auth | iron-session (encrypted HTTP-only cookies) |
| Validation | Zod (runtime + type inference) |
| Testing | Vitest + Testing Library + jsdom |

---

## Project Layout

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout — wraps with Web3Provider + AuthProvider
│   ├── page.tsx                # Landing page (Server Component)
│   ├── middleware.ts           # Request/response middleware
│   ├── api/                    # Route Handlers (server-only)
│   │   ├── auth/               # nonce, verify, session, logout
│   │   ├── inference/
│   │   │   ├── route.ts        # POST — run a model (x402 payment)
│   │   │   └── estimate/       # POST — estimate cost before payment
│   │   ├── inferences/         # GET list, GET/PATCH [id]
│   │   ├── models/
│   │   │   ├── route.ts        # GET available models from Replicate
│   │   │   └── schema/         # GET input schema for a model
│   │   ├── gallery/            # GET public gallery (paginated)
│   │   ├── r/[id]/             # GET public permalink
│   │   ├── stats/              # GET platform stats
│   │   ├── user/stats/         # GET per-user stats
│   │   └── admin/metrics/      # GET admin metrics
│   ├── inference/              # Inference UI pages
│   │   ├── page.tsx            # Task selector
│   │   ├── text-to-image/
│   │   ├── text-to-text/
│   │   └── text-to-sound/
│   ├── gallery/                # Public gallery browser
│   ├── templates/              # Prompt templates browser
│   ├── r/[id]/                 # Public permalink page (OG metadata)
│   ├── dashboard/              # User dashboard
│   ├── admin/                  # Admin dashboard
│   └── history/                # User history pages + [id] detail
├── components/
│   ├── ui/                     # shadcn/ui primitives (do not edit manually)
│   ├── layout/                 # site-header (with mobile menu), site-footer
│   ├── auth/                   # sign-in-button
│   ├── wallet/                 # wallet-button, wallet-details, connect-dialog
│   ├── inference/              # inference-form, result, loading, model-selector,
│   │                           # cost-estimate, payment-confirm-dialog,
│   │                           # text-result, image-result, audio-result
│   ├── gallery/                # gallery-grid, public-result-view
│   ├── templates/              # template-grid
│   ├── history/                # inference-history, inference-history-card
│   ├── admin/                  # admin-dashboard
│   ├── dashboard/              # user-dashboard
│   ├── sections/               # Landing page: hero, showcase, how-it-works,
│   │                           # features, pricing, templates, stats, cta
│   ├── feature-card.tsx        # Reusable card components
│   ├── section-heading.tsx
│   ├── stat-item.tsx
│   ├── step-card.tsx
│   ├── logo.tsx
│   └── nav-link.tsx
├── hooks/                      # Custom React hooks (data + side-effects only)
│   ├── use-auth.ts             # Current user session
│   ├── use-inference.ts        # Run inference (POST /api/inference)
│   ├── use-inference-history.ts
│   ├── use-inference-detail.ts
│   ├── use-models.ts           # Available models from Replicate
│   ├── use-model-schema.ts     # Input schema for a model
│   ├── use-cost-estimate.ts    # Estimate cost before payment
│   ├── use-gallery.ts          # Public gallery
│   ├── use-share-inference.ts  # Share/unshare publicly
│   ├── use-wallet-balances.ts  # USDC balance + gas estimate
│   ├── use-x402-payment.ts     # Prepare x402 payment signature
│   ├── use-admin-metrics.ts
│   ├── use-platform-stats.ts
│   └── use-user-stats.ts
├── lib/                        # Pure utilities, SDK clients, config
│   ├── db/
│   │   ├── index.ts            # Drizzle ORM instance
│   │   └── schema.ts           # Database schema (users, inferences)
│   ├── env.ts                  # Client env validation (Zod, NEXT_PUBLIC_* only)
│   ├── server-env.ts           # Server env validation (Zod)
│   ├── auth.ts                 # SIWE authentication utilities
│   ├── session.ts              # iron-session config
│   ├── x402.ts                 # x402 payment protocol helpers
│   ├── pricing.ts              # Cost estimation + USDC conversion
│   ├── contracts.ts            # USDC contract addresses/ABIs
│   ├── wagmi.ts                # Wagmi config (Ethereum mainnet + Sepolia + Anvil)
│   ├── replicate.ts            # Replicate API client singleton
│   ├── r2.ts                   # R2 upload + public URL helpers
│   ├── rate-limit.ts           # Rate limiting utilities
│   ├── templates.ts            # 16 curated prompt template definitions
│   ├── inference-utils.ts      # Inference utility functions
│   ├── inference-error.ts      # Custom error classes for inference pipeline
│   ├── model-discovery.ts      # Model caching + discovery logic
│   ├── fetch-with-timeout.ts   # Fetch wrapper with timeout
│   ├── admin.ts                # Admin utilities
│   ├── toast.tsx               # Toast notification component
│   └── utils.ts                # cn() helper only
├── providers/
│   ├── web3-provider.tsx       # Wagmi provider setup
│   └── auth-provider.tsx       # Authentication context provider
└── types/
    ├── inference.ts            # Inference Zod schemas + types
    └── task-config.ts          # Task configuration (TASK_CONFIGS map)
```

---

## Block Separation Rules

### 1. Server vs Client Components

- **Default to Server Components.** Add `"use client"` only when you need browser APIs, event handlers, or React state/effects.
- Never import server-only modules (db, replicate, iron-session, AWS SDK) into Client Components.
- Never import client-only modules (wagmi hooks, window, localStorage) into Server Components or Route Handlers.
- If a page needs both: keep the server shell as a Server Component and extract the interactive part into a `"use client"` child.
- Pages using `useSearchParams()` must wrap the client component in `<Suspense>`.

```tsx
// GOOD — server page delegates interactive section to a client child
// app/inference/text-to-image/page.tsx (Server Component)
import { Suspense } from "react";
import { InferencePageLayout } from "@/components/inference/inference-page-layout"; // "use client"

export default function Page() {
  return (
    <Suspense>
      <InferencePageLayout task="text-to-image" />
    </Suspense>
  );
}
```

### 2. Route Handlers (API)

Each Route Handler owns one concern. Do not combine unrelated logic in a single file.

- Validate the request body with Zod — return 400 on failure.
- Require auth by reading the iron-session — return 401 if missing.
- Return structured JSON errors: `{ error: string, code: string }`.
- Use server-env validated vars only (`src/lib/server-env.ts`).

```ts
// Pattern for every Route Handler
export async function POST(req: Request) {
  const session = await getSession();
  if (!session.address) return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json();
  const parsed = MySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });

  // ... business logic ...
}
```

### 3. Hooks (`src/hooks/`)

Hooks fetch or mutate data — they do not render UI.

- One hook = one concern (e.g., `useModels`, `useInference`).
- Wrap React Query `useQuery` / `useMutation` and expose typed return values.
- Never put JSX inside a hook.
- Hooks that require auth should gracefully handle unauthenticated state (return `null` data, not throw).
- All hooks must be called before any early returns (React rules of hooks).

### 4. Library Utilities (`src/lib/`)

Pure functions and SDK singleton instances. No React, no hooks.

- `env.ts` — client-safe env vars (only `NEXT_PUBLIC_*`).
- `server-env.ts` — server-only env vars. Import only in Route Handlers and server utilities.
- `utils.ts` — `cn()` helper only. Do not add unrelated utilities here; create a dedicated file.
- `templates.ts` — prompt template definitions. Exports `PROMPT_TEMPLATES`, `getTemplatesByTask()`, `getTemplateById()`, `getCategories()`.
- SDK clients (replicate, db, r2) are singletons — do not instantiate them in components.

### 5. Types (`src/types/`)

- Define Zod schemas first, then infer TypeScript types from them (`z.infer<typeof Schema>`).
- Share types between client and server via `src/types/`. Never define types inline in components.
- Task-specific configs live in `task-config.ts` — the `TASK_CONFIGS` map is the single source of truth for input fields, icons, and output types.

---

## Coding Conventions

### TypeScript

- Strict mode is enabled — no `any`, no `@ts-ignore` without explanation.
- Prefer `type` over `interface` for object shapes derived from Zod schemas.
- Use `z.infer<typeof Schema>` for types instead of duplicating them.

### Tailwind CSS

- Use `cn()` from `@/lib/utils` for conditional class merging.
- Prefer Tailwind utilities over inline styles.
- Use the CSS custom property color tokens (e.g., `bg-primary`, `text-muted-foreground`) — do not hardcode hex/rgb values.
- Dark mode is toggled via `.dark` class — ensure all new components respond correctly.

### Components

- shadcn/ui components in `src/components/ui/` are generated by the CLI (`pnpm dlx shadcn add <component>`). Do not hand-edit them — regenerate instead.
- Feature components are colocated by domain under `src/components/{domain}/`.
- Landing page visual sections go in `src/components/sections/`.
- Reusable atomic components (feature-card, section-heading, stat-item, step-card, logo, nav-link) live at `src/components/` root.
- Props interfaces should be defined in the same file as the component (unless shared).

### Naming

| Item | Convention |
|---|---|
| Files | `kebab-case.tsx` |
| Components | `PascalCase` |
| Hooks | `useCamelCase` |
| Utilities / constants | `camelCase` |
| Env vars | `SCREAMING_SNAKE_CASE` |
| DB columns | `camelCase` (Drizzle maps to snake_case in SQL) |

---

## Database

### Schema Changes

1. Edit `src/lib/db/schema.ts`.
2. Run `pnpm db:generate` to create a migration.
3. Run `pnpm db:migrate` to apply it.
4. Never hand-edit migration files.
5. Use `pnpm db:push` only in local development when you want to skip migration files.

### Current Schema

- **`users`** — `address` (PK), `created_at`, `last_seen_at`
- **`inferences`** — `id` (UUID PK), `user_address` (FK), `task_type`, `model`, `input`, `output_type`, `output_data`, `r2_keys`, `status`, `error_message`, `predict_time_ms`, `estimated_cost_usdc`, `actual_cost_usdc`, `payment_tx_hash` (unique), `payment_chain_id`, `is_public` (0/1), `created_at`

### Enums

- `task_type`: `text-to-image`, `text-to-text`, `text-to-sound`
- `output_type`: `text`, `image`, `audio`
- `inference_status`: `pending`, `succeeded`, `failed`

### Query Patterns

- All DB access is server-side only (Route Handlers or Server Actions).
- Use Drizzle's query builder — avoid raw SQL strings.
- When inserting new records use `onConflictDoUpdate` for upsert patterns (see `users` table logic in auth/verify).

---

## Web3 / Wallet Patterns

### Authentication Flow (SIWE)

```
GET  /api/auth/nonce   → generate + store nonce in session
POST /api/auth/verify  → verify signature, upsert user, save session
GET  /api/auth/session → read current session (used by useAuth hook)
POST /api/auth/logout  → destroy session
```

- The nonce must be consumed once — clear it from session after verification.
- Store only `address` (lowercased) and `chainId` in the session. No sensitive data.
- Wallet address comparisons must always be case-insensitive or normalized to lowercase.

### Supported Networks

- **Ethereum Mainnet** (chainId: 1)
- **Ethereum Sepolia** (chainId: 11155111)
- **Base Mainnet** (chainId: 8453)
- **Base Sepolia** (chainId: 84532)
- **Anvil** (chainId: 31337, local dev only — payment settlement is mocked)

Do not add new networks without updating `src/lib/wagmi.ts` and `src/lib/contracts.ts`.

### USDC Contracts

- Ethereum Mainnet: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- Ethereum Sepolia: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- Decimals: 6

---

## Inference & Payment Pipeline

```
Client → POST /api/inference/estimate
         └─ Server returns cost estimate (no payment needed)

Client → POST /api/inference (no Payment-Signature header)
         └─ Server returns 402 + Payment-Required header (estimated cost)

Client → POST /api/inference (with Payment-Signature header)
         ├─ Auth check (iron-session)
         ├─ Zod validation
         ├─ Decode + verify payment payload
         ├─ Verify with x402 facilitator
         ├─ Settle payment on-chain (USDC transfer)     ← BEFORE inference
         ├─ Replicate.run(model, input)                  ← AFTER settlement
         ├─ If media output:
         │    ├─ Download from Replicate URL
         │    ├─ Upload to R2 at {address}/{inferenceId}/{n}.{ext}
         │    └─ Return permanent public URL
         ├─ If text output:
         │    └─ Store directly in DB (outputData jsonb)
         └─ INSERT into inferences table → return result
```

- **Settlement happens before inference.** If settlement fails, no compute runs. If inference fails after settlement, the failure is recorded with the payment tx hash.
- Media is served via permanent public R2 URLs — URLs never expire.
- R2 key format: `{walletAddress}/{inferenceId}/{index}.{ext}` — keep this consistent for any new media types.
- `predictTimeMs` tracks end-to-end Replicate execution time — always record it.
- Cost is `$0.001 USDC per second` of compute by default (configurable via `INFERENCE_RATE_PER_SEC`).

---

## Environment Variables

### Client (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_ETHEREUM_RPC_URL
NEXT_PUBLIC_SEPOLIA_RPC_URL
NEXT_PUBLIC_BASE_RPC_URL
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
NEXT_PUBLIC_ENABLE_DEV_CHAIN
```
Validated in `src/lib/env.ts`.

### Server-only
```
REPLICATE_API_TOKEN
DATABASE_URL
SESSION_SECRET          # min 32 chars, random
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL           # required — public URL for the R2 bucket
RECEIVER_ADDRESS        # Ethereum address receiving USDC payments
INFERENCE_RATE_PER_SEC  # optional, default 0.001
X402_FACILITATOR_URL    # optional, default https://www.x402.org/facilitator
ADMIN_ADDRESSES         # optional, comma-separated admin wallets
```
Validated in `src/lib/server-env.ts`. Startup will throw if any required vars are missing.

---

## Testing

**Framework:** Vitest + @testing-library/react + jsdom

**Run tests:**
```bash
pnpm test          # single run (CI)
pnpm test:watch    # watch mode (development)
```

**Test file location:** colocate with the module under test.
```
src/lib/x402.ts
src/lib/x402.test.ts                    ← colocated
src/app/api/inference/route.ts
src/app/api/inference/route.test.ts     ← colocated
```

**Current test files (8):**
- `src/app/api/inference/route.test.ts` — inference endpoint integration
- `src/app/api/models/route.test.ts` — models endpoint integration
- `src/lib/inference-error.test.ts` — error class handling
- `src/lib/inference-utils.test.ts` — utility functions
- `src/lib/model-discovery.test.ts` — model caching + discovery
- `src/lib/x402.test.ts` — x402 payment protocol
- `src/types/inference.test.ts` — Zod schema validation
- `src/types/task-config.test.ts` — task config validation

**What to test:**

| Layer | Test type | Priority |
|---|---|---|
| `src/lib/` pure utilities | Unit | High |
| `src/hooks/` (mock fetch) | Unit with MSW or vi.fn() | High |
| Zod schemas in `src/types/` | Unit (parse valid + invalid) | High |
| `src/components/` | Component tests (RTL) | Medium |
| API Route Handlers | Integration (mock DB + session) | Medium |
| Full flows | E2E (optional, Playwright) | Low |

**Mocking guidelines:**
- Mock `fetch` or use MSW for hook tests — never hit real APIs in unit tests.
- Mock `iron-session` to control auth state in Route Handler tests.
- Mock Drizzle ORM calls with `vi.mock('@/lib/db')`.
- Do not mock internal pure functions — test them directly.
- `getPublicUrls` is synchronous — use `mockReturnValue`, not `mockResolvedValue`.

---

## Common Commands

```bash
pnpm dev              # start dev server (localhost:3000)
pnpm build            # production build
pnpm lint             # ESLint check
pnpm test             # run all tests
pnpm test:watch       # watch mode
pnpm db:generate      # generate DB migration from schema changes
pnpm db:migrate       # apply pending migrations
pnpm db:push          # push schema directly (dev only)
pnpm db:studio        # open Drizzle Studio (DB browser)
pnpm chain:start      # start local Anvil dev chain
pnpm chain:fund       # fund test wallets with USDC
pnpm dlx shadcn add <component>  # add a new shadcn/ui component
```

---

## What NOT to Do

- Do not import `src/lib/server-env.ts` or `src/lib/db/` from any Client Component or hook.
- Do not store JWTs, private keys, or plaintext secrets in the session or database.
- Do not hardcode contract addresses outside `src/lib/contracts.ts`.
- Do not mutate shadcn/ui files in `src/components/ui/` by hand.
- Do not write raw SQL strings — use Drizzle's query builder.
- Do not skip Zod validation on any Route Handler input.
- Do not use presigned URLs — media is served via permanent public R2 URLs.
- Do not settle payment after inference — always settle first.
- Do not add new `NEXT_PUBLIC_` vars without adding them to `src/lib/env.ts`.
- Do not add new server env vars without adding them to `src/lib/server-env.ts`.
- Do not call hooks after early returns — React rules of hooks must be followed.
