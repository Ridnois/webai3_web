# Development Docs Updates — Free Inferences Feature

**Before any code changes, update these documentation files:**

---

## 1. CLAUDE.md — Main Project Documentation

### A. Add to "Project Layout" Section (after `src/providers/`)

```markdown
├── free-inferences-celebration.tsx
├── use-free-credit-status.ts
├── use-grant-free-inferences.ts
└── wallet-bonus-provider.tsx
```

**Full context section to add:**

```markdown
### Free Inferences Feature

After implementing the free inferences feature, add this to the main project layout section:

**New Hooks:**
- `use-free-credit-status.ts` — Check remaining free inferences balance for current user
- `use-grant-free-inferences.ts` — Grant free inferences to new users on first connection

**New Components:**
- `free-inferences-celebration.tsx` — Modal dialog with confetti animation for new user bonus

**New Provider:**
- `wallet-bonus-provider.tsx` — Monitors auth state and triggers free inference grant flow

**New API Endpoints:**
- `POST /api/inferences/grant-free-credit` — Grant free inferences to new user with funds
- `GET /api/inferences/free-credit-status` — Check free inference balance
```

### B. Update "Database" Section

Replace the "Current Schema" subsection with:

```markdown
### Current Schema

- **`users`** — `address` (PK), `createdAt`, `lastSeenAt`, `hasClaimedFreeInferences`
- **`inferences`** — `id` (UUID PK), `userAddress` (FK), `taskType`, `model`, `input`, `outputType`, `outputData`, `r2Keys`, `status`, `errorMessage`, `predictTimeMs`, `estimatedCostUsdc`, `actualCostUsdc`, `paymentTxHash` (unique), `paymentChainId`, `isPublic` (0/1), `isFreeInference` (0/1), `createdAt`
- **`freeInferenceGrants`** — `id` (UUID PK), `address` (FK), `creditAmount`, `usedCount`, `grantedAt`, `expiresAt`, `createdAt`
```

### C. Add New Section After "Database"

```markdown
## Free Inferences System

### Overview

New users with USDC balance receive 5 free inferences on first wallet connection. Credits are tracked in the `freeInferenceGrants` table and deducted before charging USDC payments.

### Endpoints

**POST /api/inferences/grant-free-credit**
- Grants 5 free inferences to a new user (idempotent)
- Requires authenticated session
- Request: `{ chainId: number }`
- Response: `{ granted: boolean, creditAmount: number, message: string }`
- Returns 402 if user has zero USDC balance

**GET /api/inferences/free-credit-status**
- Returns free credit balance and grant metadata
- Requires authenticated session
- Response: `{ hasFreeCredit: boolean, remainingCredit: number, grantedAt: string, expiresAt: string | null }`

### Payment Flow Changes

When user runs inference:
1. Check `freeInferenceGrants` for remaining balance
2. If balance > 0: deduct 1 credit, set `isFreeInference=1`, skip x402 payment
3. If balance = 0: require x402 payment signature as before

### Frontend Integration

The `WalletBonusProvider` wraps the app in `src/app/layout.tsx` and:
1. Monitors auth state changes
2. On first successful sign-in, checks USDC balance
3. If balance > 0, calls `grant-free-credit` endpoint
4. On success, displays `FreeInferencesCelebration` dialog with confetti

### Key Implementation Notes

- Balance check is client-side (trusts Wagmi assertion) for speed
- Grants are idempotent — reconnecting doesn't grant multiple times
- Free inferences currently don't expire (optional future feature)
- Confetti animation uses `canvas-confetti` library (~2KB gzipped)
```

### D. Add to "Environment Variables" Section

No new required variables, but add optional comment:

```markdown
### Optional — Free Inferences Configuration

These can be added in the future to make the system configurable:

```
FREE_INFERENCE_CREDIT_AMOUNT=5       # Number of free inferences per new user (default: 5)
FREE_INFERENCE_EXPIRATION_DAYS=30    # Days until free credits expire (default: never)
```

Validate in `src/lib/server-env.ts` when added.
```

### E. Update "Testing" Section

Add to the test file list:

```markdown
- `src/hooks/use-free-credit-status.test.ts` — Free credit status queries
- `src/hooks/use-grant-free-inferences.test.ts` — Free credit grant mutations
- `src/app/api/inferences/grant-free-credit/route.test.ts` — Grant endpoint
- `src/app/api/inferences/free-credit-status/route.test.ts` — Status endpoint
```

Add to testing strategy:

```markdown
**Free Inferences Testing**

| Layer | Test type | Files |
|---|---|---|
| Free credit hooks | Unit with MSW mocking | `use-free-credit-status.test.ts`, `use-grant-free-inferences.test.ts` |
| Grant endpoint | Integration (mock DB + session) | `src/app/api/inferences/grant-free-credit/route.test.ts` |
| Status endpoint | Integration (mock DB + session) | `src/app/api/inferences/free-credit-status/route.test.ts` |
| Inference endpoint | Integration (modify existing to test free vs paid) | `src/app/api/inference/route.test.ts` |
| Celebration component | Component (RTL) | `free-inferences-celebration.test.tsx` |

Key scenarios to test:
- New user with USDC → grant succeeds, dialog shown, confetti plays
- New user without USDC → grant fails silently, no dialog
- Reconnecting user → no grant (idempotent)
- Free credit exhaustion → falls back to x402 payment
```

### F. Update "Common Commands" Section

Add optional note:

```markdown
# After implementing Free Inferences feature:
pnpm add canvas-confetti    # Install confetti animation library
pnpm db:generate            # Generate migration for freeInferenceGrants table
```

---

## 2. Create NEW File: `.claude/FREE_INFERENCES_DEV_NOTES.md`

This file provides quick reference for developers working on or maintaining the feature:

```markdown
# Free Inferences Feature — Quick Reference

## Overview
- 5 free inferences granted to new users with USDC balance on first connection
- Tracked in `free_inference_grants` table
- Deducted before x402 USDC payment
- Idempotent — no duplicates on reconnect

## Key Components

| File | Purpose | Type |
|---|---|---|
| `use-free-credit-status.ts` | Query free credit balance | Hook |
| `use-grant-free-inferences.ts` | Grant credits to new user | Hook |
| `free-inferences-celebration.tsx` | Confetti + dialog modal | Component |
| `wallet-bonus-provider.tsx` | Orchestrates bonus flow | Provider |
| `grant-free-credit/route.ts` | Endpoint to grant credits | API |
| `free-credit-status/route.ts` | Endpoint to check balance | API |

## Typical Development Tasks

### Add a new free inference grant
```typescript
const { grantCredit } = useGrantFreeInferences();
const response = await grantCredit(chainId);
if (response.granted) {
  // Show celebration
}
```

### Check user's free credit balance
```typescript
const { status } = useFreeCreditStatus();
const remaining = status?.remainingCredit ?? 0;
```

### Deduct free inference in inference endpoint
```typescript
// In POST /api/inference:
const freeGrant = await db
  .select()
  .from(freeInferenceGrants)
  .where(eq(freeInferenceGrants.address, userAddress));

if (freeGrant.length > 0 && freeGrant[0].usedCount < 5) {
  // Use free credit
  isFreeInference = true;
  await db.update(freeInferenceGrants).set({ usedCount: freeGrant[0].usedCount + 1 });
}
```

## Common Debugging

**Q: User doesn't see celebration dialog after connecting**
- Check: Does user have USDC balance? (must be > 0)
- Check: Browser console for `grant-free-credit` response
- Check: `free_inference_grants` table for existing record

**Q: Free credits aren't being deducted**
- Check: `usedCount` in database is actually incrementing
- Check: Inference endpoint is checking `freeInferenceGrants` table
- Check: `isFreeInference` flag is being set to 1

**Q: Confetti animation is laggy**
- The `canvas-confetti` library is already lightweight
- Check: Device GPU performance, disable if < 30 FPS
- Consider: Reduce animation duration in `FreeInferencesCelebration`

## Testing Checklist

- [ ] New user with USDC balance → grant endpoint returns `granted: true`
- [ ] New user with $0 balance → grant endpoint returns 402 or `granted: false`
- [ ] Reconnecting user → grant endpoint returns `granted: false` (idempotent)
- [ ] Free inference deduction → `usedCount` increments in DB
- [ ] 6th inference attempt → x402 payment required (free credits exhausted)
- [ ] Dialog and confetti display correctly
- [ ] Dialog doesn't block other page interactions

## Future Enhancements

- [ ] Add credit expiration based on `FREE_INFERENCE_EXPIRATION_DAYS` env var
- [ ] Implement server-side balance verification (prevent fraud)
- [ ] Add analytics tracking for free credit claims and usage
- [ ] A/B test credit amounts per user cohort
- [ ] Add referral tracking integration
- [ ] Tiered bonuses based on wallet balance tiers
```

---

## 3. Create NEW File: `README_FREE_INFERENCES.md` (Optional)

For public/external documentation:

```markdown
# Free Inferences Feature

## For Users

New users who connect their wallet and have USDC in their account receive **5 free AI inferences** as a welcome bonus. This is our way of letting you try the platform without risk.

### How to claim:
1. Connect your wallet via the Sign In button
2. Make sure your wallet has at least $1 USDC
3. On successful connection, you'll see a celebration screen with confetti 🎉
4. You have 5 free inferences to use — get started!

### FAQ

**Q: What if I don't have USDC in my wallet?**
A: Free inferences are only available to users with USDC balance. You can still use the platform by paying for inferences via x402 protocol.

**Q: Can I get free inferences again by disconnecting and reconnecting?**
A: No, free inferences are one-time per wallet address. You'll see them tracked in your account.

**Q: Do free inferences expire?**
A: Not currently — they're available indefinitely until you use them all.

**Q: What if I use all 5 and want more?**
A: You'll need to purchase additional inferences using USDC and the x402 payment protocol.

## For Developers

See `.claude/FREE_INFERENCES_DEV_NOTES.md` for implementation details and quick reference.

For detailed technical specification, see `FREE_INFERENCES_FEATURE.md`.
```

---

## Summary of Changes

### Before any code modifications:

**MUST UPDATE:**
1. ✅ `CLAUDE.md` — Add new hooks, components, providers, API endpoints, and database schema
2. ✅ `.claude/FREE_INFERENCES_DEV_NOTES.md` — Create quick reference guide

**SHOULD UPDATE (optional):**
3. `README_FREE_INFERENCES.md` — Create user-facing documentation (optional)

### Files to read before starting Phase 1:

1. `FREE_INFERENCES_FEATURE.md` — Full technical specification
2. `CLAUDE.md` — To understand existing structure
3. `src/lib/db/schema.ts` — To see current table structure
4. `src/app/api/auth/verify/route.ts` — To understand user creation flow

---

**Next Steps:**

Once these docs are updated, proceed with implementation:
- Phase 1: Database & Backend
- Phase 2: Frontend Components
- Phase 3: Integration
- Phase 4: Testing
- Phase 5: Final Documentation
