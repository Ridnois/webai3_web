# CLAUDE.md — webai3_web

Web3-enabled AI inference platform. Users authenticate via wallet (SIWE), then pay-per-use to run AI models (text-to-image, text-to-text, text-to-sound) through the Replicate API. Results are stored in Cloudflare R2 and indexed in PostgreSQL.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 + shadcn/ui (New York) |
| Web3 | Wagmi v2 + viem + SIWE (EIP-4361) |
| Server State | TanStack React Query v5 |
| Database | PostgreSQL + Drizzle ORM |
| AI Models | Replicate API |
| Storage | Cloudflare R2 (S3-compatible) |
| Auth | iron-session (encrypted HTTP-only cookies) |
| Validation | Zod (runtime + type inference) |
| Testing | Vitest + Testing Library + jsdom |

---

## Project Layout

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout — wraps with Web3Provider
│   ├── page.tsx            # Landing page (Server Component)
│   ├── api/                # Route Handlers (server-only)
│   │   ├── auth/           # nonce, verify, session, logout
│   │   ├── inference/      # POST — run a model
│   │   ├── inferences/     # GET list + GET [id]
│   │   └── models/         # GET available models from Replicate
│   ├── inference/          # Inference UI pages
│   │   ├── page.tsx        # Task selector
│   │   ├── text-to-image/
│   │   ├── text-to-text/
│   │   └── text-to-sound/
│   └── history/            # User history pages
├── components/
│   ├── ui/                 # shadcn/ui primitives (do not edit manually)
│   ├── layout/             # site-header, site-footer
│   ├── auth/               # sign-in-button
│   ├── wallet/             # wallet-button, wallet-details, connect-dialog
│   ├── inference/          # inference-form, result, loading, model-selector
│   ├── history/            # inference-history
│   └── sections/           # Landing page sections
├── hooks/                  # Custom React hooks (data + side-effects only)
├── lib/                    # Pure utilities, SDK clients, config
│   ├── db/                 # Drizzle instance + schema
│   ├── wagmi.ts            # Wagmi config (Base + Base Sepolia)
│   ├── contracts.ts        # USDC contract addresses/ABIs
│   ├── session.ts          # iron-session config
│   ├── env.ts              # Client env validation (Zod)
│   └── server-env.ts       # Server env validation (Zod)
├── providers/              # React context providers
└── types/                  # Shared TypeScript types + Zod schemas
```

---

## Block Separation Rules

### 1. Server vs Client Components

- **Default to Server Components.** Add `"use client"` only when you need browser APIs, event handlers, or React state/effects.
- Never import server-only modules (db, replicate, iron-session, AWS SDK) into Client Components.
- Never import client-only modules (wagmi hooks, window, localStorage) into Server Components or Route Handlers.
- If a page needs both: keep the server shell as a Server Component and extract the interactive part into a `"use client"` child.

```tsx
// GOOD — server page delegates interactive section to a client child
// app/inference/text-to-image/page.tsx (Server Component)
import { InferenceForm } from "@/components/inference/inference-form"; // "use client"

export default function Page() {
  return <InferenceForm task="text-to-image" />;
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

### 4. Library Utilities (`src/lib/`)

Pure functions and SDK singleton instances. No React, no hooks.

- `env.ts` — client-safe env vars (only `NEXT_PUBLIC_*`).
- `server-env.ts` — server-only env vars. Import only in Route Handlers and server utilities.
- `utils.ts` — `cn()` helper only. Do not add unrelated utilities here; create a dedicated file.
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

- **Base Mainnet** (chainId: 8453)
- **Base Sepolia** (chainId: 84532)

Do not add new networks without updating `src/lib/wagmi.ts` and `src/lib/contracts.ts`.

### USDC Contracts

- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Decimals: 6

---

## Inference & Media Storage Pipeline

```
Client → POST /api/inference
         ├─ Auth check (iron-session)
         ├─ Zod validation
         ├─ Replicate.run(model, input)
         ├─ If media output:
         │    ├─ Download from Replicate URL
         │    ├─ Upload to R2 at {address}/{inferenceId}/{n}.{ext}
         │    └─ Generate presigned URL (1 hour TTL)
         ├─ If text output:
         │    └─ Store directly in DB (outputData jsonb)
         └─ INSERT into inferences table → return result
```

- Presigned URLs expire in **1 hour** — do not cache them beyond that.
- R2 key format: `{walletAddress}/{inferenceId}/{index}.{ext}` — keep this consistent for any new media types.
- `predictTimeMs` tracks end-to-end Replicate execution time — always record it.

---

## Environment Variables

### Client (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_BASE_RPC_URL
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
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
R2_PUBLIC_URL           # (optional) public CDN URL
```
Validated in `src/lib/server-env.ts`. Startup will throw if any are missing.

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
src/hooks/use-auth.ts
src/hooks/use-auth.test.ts   ← colocated
```

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

**Test structure:**
```ts
describe("useInference", () => {
  it("calls POST /api/inference with correct payload", async () => { ... });
  it("returns error state when API returns 401", async () => { ... });
  it("invalidates inference history cache on success", async () => { ... });
});
```

---

## Common Commands

```bash
pnpm dev              # start dev server (localhost:3000)
pnpm build            # production build
pnpm lint             # ESLint check
pnpm test             # run all tests
pnpm db:generate      # generate DB migration from schema changes
pnpm db:migrate       # apply pending migrations
pnpm db:studio        # open Drizzle Studio (DB browser)
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
- Do not cache presigned R2 URLs for more than 1 hour.
- Do not add new `NEXT_PUBLIC_` vars without adding them to `src/lib/env.ts`.
- Do not add new server env vars without adding them to `src/lib/server-env.ts`.
