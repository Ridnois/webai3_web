# Free Inferences Feature — Implementation Checklist

**Status:** Ready for Phase 1

**Created:** 2026-03-25
**Target:** Complete by [TBD]
**Owner:** [Assign]

---

## 📋 PRE-IMPLEMENTATION: Documentation Updates

**Complete these BEFORE writing any code:**

### Step 1: Update CLAUDE.md

- [ ] Add "Free Inferences System" section after Database section
- [ ] Update Database schema with 3 new/modified tables:
  - `users` — add `hasClaimedFreeInferences` column
  - `inferences` — add `isFreeInference` column
  - `freeInferenceGrants` — new table
- [ ] Add new API endpoints documentation:
  - `POST /api/inferences/grant-free-credit`
  - `GET /api/inferences/free-credit-status`
- [ ] Add new hooks in Project Layout:
  - `use-free-credit-status.ts`
  - `use-grant-free-inferences.ts`
- [ ] Add new components in Project Layout:
  - `free-inferences-celebration.tsx`
- [ ] Add new provider in Project Layout:
  - `wallet-bonus-provider.tsx`
- [ ] Update testing section with new test files
- [ ] Add note about `canvas-confetti` dependency in "Common Commands"

### Step 2: Create `.claude/FREE_INFERENCES_DEV_NOTES.md`

- [ ] Create file with quick reference for developers
- [ ] Include component/file overview table
- [ ] Add typical development task examples
- [ ] Add debugging FAQ
- [ ] Add testing checklist
- [ ] Add future enhancements list

### Step 3: Review Key Existing Files (Read-Only)

- [ ] Read `CLAUDE.md` (architecture, conventions)
- [ ] Read `src/lib/db/schema.ts` (current schema structure)
- [ ] Read `src/app/api/auth/verify/route.ts` (user creation flow)
- [ ] Read `src/providers/auth-provider.tsx` (auth flow, where to hook)
- [ ] Read `src/hooks/use-wallet-balances.ts` (balance checking pattern)

✅ **Documentation complete — Ready for Phase 1**

---

## 🗄️ PHASE 1: Database & Backend

### Step 1: Database Schema

- [ ] Update `src/lib/db/schema.ts`:
  - [ ] Add `hasClaimedFreeInferences` boolean field to `users` table
  - [ ] Add `isFreeInference` integer field to `inferences` table
  - [ ] Create new `freeInferenceGrants` table with all 7 fields
- [ ] Generate migration: `pnpm db:generate`
- [ ] Review generated migration file for correctness
- [ ] Run migration locally: `pnpm db:migrate`
- [ ] Verify in Drizzle Studio: `pnpm db:studio`

### Step 2: API Endpoints — Grant Free Credit

**File:** `src/app/api/inferences/grant-free-credit/route.ts`

- [ ] Create directory structure
- [ ] Implement `POST /api/inferences/grant-free-credit`:
  - [ ] Validate auth (iron-session)
  - [ ] Parse `{ chainId: number }` from request body
  - [ ] Check if user already has grant record (idempotent)
  - [ ] If exists: return `{ granted: false }`
  - [ ] If not exists: Insert new grant record
  - [ ] Mark user `hasClaimedFreeInferences = true`
  - [ ] Return `{ granted: true, creditAmount: 5, message: "..." }`
- [ ] Handle error cases:
  - [ ] Return 401 if unauthenticated
  - [ ] Return 400 if invalid request body
  - [ ] Return 500 if DB error

**Tests:** `src/app/api/inferences/grant-free-credit/route.test.ts`

- [ ] New user without prior grant → returns `granted: true`
- [ ] User with existing grant → returns `granted: false` (idempotent)
- [ ] Unauthenticated request → returns 401
- [ ] Invalid request body → returns 400
- [ ] DB error → returns 500 with error message

### Step 3: API Endpoints — Free Credit Status

**File:** `src/app/api/inferences/free-credit-status/route.ts`

- [ ] Implement `GET /api/inferences/free-credit-status`:
  - [ ] Validate auth
  - [ ] Query `free_inference_grants` for user's address
  - [ ] Calculate remaining credit: `creditAmount - usedCount`
  - [ ] Return full grant record with remaining balance
  - [ ] Return empty object if no grant found

**Tests:** `src/app/api/inferences/free-credit-status/route.test.ts`

- [ ] User with grant → returns full grant data with remaining balance
- [ ] User without grant → returns appropriate empty response
- [ ] Unauthenticated → returns 401

### Step 4: Update Inference Endpoint for Free Credit

**File:** `src/app/api/inference/route.ts`

- [ ] Add free credit check before x402 payment:
  - [ ] Query `free_inference_grants` for user
  - [ ] If grant exists and `usedCount < creditAmount`:
    - [ ] Set `isFreeInference = 1`
    - [ ] Increment `freeInferenceGrants.usedCount`
    - [ ] Skip x402 payment verification
    - [ ] Set `actualCostUsdc = "0"`
  - [ ] Else: Require x402 payment (existing flow)
- [ ] Run inference (same logic for both free and paid)
- [ ] Insert inference record with `isFreeInference` flag
- [ ] Do NOT charge user if free credit was used

**Tests:** Update `src/app/api/inference/route.test.ts`

- [ ] User with free credit available → inference is free
- [ ] User with free credit exhausted → requires x402 payment
- [ ] Free inference inserted with `isFreeInference = 1`
- [ ] Free inference inserted with `actualCostUsdc = "0"`

### Step 5: Run All Backend Tests

- [ ] `pnpm test` — All tests pass
- [ ] `pnpm lint` — No linting errors
- [ ] Manual testing with local dev chain

✅ **Phase 1 complete — Database & Backend ready**

---

## 🎨 PHASE 2: Frontend Components & Hooks

### Step 1: Install Dependencies

- [ ] Add `canvas-confetti` to dependencies: `pnpm add canvas-confetti`
- [ ] Add type definitions (if needed): `pnpm add -D @types/canvas-confetti`

### Step 2: Create Hooks

**File:** `src/hooks/use-free-credit-status.ts`

- [ ] Define interface: `FreeCreditStatus`
- [ ] Fetch from `GET /api/inferences/free-credit-status`
- [ ] Use React Query with 1-minute stale time
- [ ] Handle unauthenticated state gracefully
- [ ] Return: `{ status, isLoading, error, refetch }`

**Tests:** `src/hooks/use-free-credit-status.test.ts`

- [ ] Successfully fetches status from endpoint
- [ ] Returns null if user is unauthenticated
- [ ] Can refetch on demand
- [ ] Handles network errors

**File:** `src/hooks/use-grant-free-inferences.ts`

- [ ] Define interface: `GrantResponse`
- [ ] POST to `POST /api/inferences/grant-free-credit`
- [ ] Use React Query mutation
- [ ] Return: `{ grantCredit, isGranting, error }`
- [ ] `grantCredit(chainId)` returns Promise<GrantResponse>

**Tests:** `src/hooks/use-grant-free-inferences.test.ts`

- [ ] Successfully grants credit and returns response
- [ ] Can be called multiple times (idempotent)
- [ ] Handles network errors gracefully
- [ ] Tracks loading state

### Step 3: Create Components

**File:** `src/components/inference/free-inferences-celebration.tsx`

Props:
```typescript
interface FreeInferencesCelebrationProps {
  creditAmount: number;      // e.g., 5
  isOpen: boolean;           // Controls visibility
  onClose: () => void;       // Callback when user dismisses
}
```

Implementation:
- [ ] Use shadcn/ui `Dialog` component for modal
- [ ] Trigger `canvas-confetti` on mount
  - [ ] Call `confetti.create()` with canvas element
  - [ ] Run for 3-5 seconds
  - [ ] Stop animation on dialog close
- [ ] Display:
  - [ ] Title: "Welcome to WEBAI3! 🎉"
  - [ ] Message: `"You've unlocked 5 free inferences!"`
  - [ ] CTA button: "Start Inferencing" → Navigate to `/inference`
  - [ ] Close button (X icon)
- [ ] Styling:
  - [ ] Center modal on screen
  - [ ] Semi-transparent dark overlay (not blocking)
  - [ ] Confetti renders behind/within modal
  - [ ] Responsive on mobile

**Tests:** `src/components/inference/free-inferences-celebration.test.tsx`

- [ ] Renders when `isOpen=true`
- [ ] Hides when `isOpen=false`
- [ ] Calls `onClose()` when user clicks close or clicks outside
- [ ] Confetti animation triggers on mount
- [ ] CTA button navigates to `/inference`
- [ ] Dialog doesn't block page interaction

**File (Optional):** `src/components/wallet/first-time-wallet-bonus.tsx`

If you want a separate component for bonus orchestration logic:

- [ ] Accept `address` and `chainId` as props
- [ ] Fetch USDC balance (using `useWalletBalances`)
- [ ] If balance > 0: call `useGrantFreeInferences`
- [ ] If grant succeeds: render `FreeInferencesCelebration`
- [ ] If balance = 0: render nothing

---

## 🔌 PHASE 3: Integration & Providers

### Step 1: Create Wallet Bonus Provider

**File:** `src/providers/wallet-bonus-provider.tsx`

- [ ] Export `WalletBonusProvider` component
- [ ] Manage internal state:
  - [ ] `showCelebration: boolean`
  - [ ] `creditAmount: number`
  - [ ] `hasTriedGrant: boolean` (prevent duplicate attempts)
- [ ] Hook into auth context:
  - [ ] Monitor `isAuthenticated`, `sessionAddress`, `chainId`
  - [ ] Monitor USDC balance via `useWalletBalances`
- [ ] On first successful auth with balance:
  - [ ] Call `grantCredit(chainId)` via `useGrantFreeInferences`
  - [ ] If granted: set `showCelebration = true`
- [ ] Render:
  - [ ] `{children}` (rest of app)
  - [ ] `<FreeInferencesCelebration>` when `showCelebration = true`

**Logic Flow:**
```
User connects wallet
  ↓
Auth provider calls /api/auth/verify
  ↓
Session saved, isAuthenticated = true
  ↓
WalletBonusProvider detects auth change
  ↓
Check USDC balance via Wagmi
  ↓
If balance > 0:
  → Call POST /api/inferences/grant-free-credit
  → If granted: show celebration dialog with confetti
  ↓
If balance = 0:
  → Do nothing (silently skip)
```

### Step 2: Update Root Layout

**File:** `src/app/layout.tsx`

- [ ] Import `WalletBonusProvider`
- [ ] Wrap the app in provider hierarchy:
  ```typescript
  <AuthProvider>
    <WalletBonusProvider>
      {/* existing content */}
    </WalletBonusProvider>
  </AuthProvider>
  ```

### Step 3: Optional Auth Provider Cleanup

**File:** `src/providers/auth-provider.tsx`

- [ ] Review if any cleanup needed on sign-in success
- [ ] Ensure `onSuccess` callback doesn't conflict with bonus provider
- [ ] (Likely no changes needed — let `WalletBonusProvider` handle bonus logic)

### Step 4: Verify Integration

- [ ] Start dev server: `pnpm dev`
- [ ] Test full flow:
  - [ ] Connect wallet
  - [ ] Sign SIWE message
  - [ ] Observe celebration dialog (if balance > 0)
  - [ ] Confirm confetti animation plays
  - [ ] Click CTA button → navigate to `/inference`

✅ **Phase 3 complete — Integration ready**

---

## 🧪 PHASE 4: Testing & Validation

### Unit Tests

- [ ] `pnpm test -- use-free-credit-status` — 4+ test cases
- [ ] `pnpm test -- use-grant-free-inferences` — 4+ test cases
- [ ] `pnpm test -- free-inferences-celebration` — 5+ test cases
- [ ] `pnpm test -- grant-free-credit/route` — 4+ test cases
- [ ] `pnpm test -- free-credit-status/route` — 3+ test cases
- [ ] `pnpm test -- inference/route` (existing) — add 3+ new test cases

### All Tests Pass

- [ ] `pnpm test` — 100% pass rate
- [ ] `pnpm lint` — No errors
- [ ] Check coverage: `pnpm test -- --coverage` (aim for >80% on new code)

### Manual Testing Scenarios

#### Scenario 1: New User with USDC Balance

**Setup:**
- Anvil chain running locally
- Test wallet has USDC balance

**Steps:**
- [ ] Clear browser cookies/localStorage
- [ ] Navigate to app
- [ ] Click "Sign In"
- [ ] Connect test wallet
- [ ] Sign SIWE message

**Expected:**
- [ ] ✅ Confetti animation plays
- [ ] ✅ Celebration dialog appears
- [ ] ✅ Shows "5 free inferences"
- [ ] ✅ Dialog is dismissible
- [ ] ✅ CTA button works (navigates to `/inference`)
- [ ] ✅ Check DB: `free_inference_grants` record created

#### Scenario 2: New User without USDC Balance

**Setup:**
- Different wallet address
- Zero USDC balance

**Steps:**
- [ ] Connect wallet with no balance
- [ ] Sign SIWE message

**Expected:**
- [ ] ❌ NO confetti animation
- [ ] ❌ NO celebration dialog
- [ ] ✅ User is authenticated normally
- [ ] ✅ Check DB: NO `free_inference_grants` record created

#### Scenario 3: Returning User (Idempotent)

**Setup:**
- Wallet with existing `free_inference_grants` record
- Has USDC balance

**Steps:**
- [ ] Disconnect wallet
- [ ] Reconnect same wallet

**Expected:**
- [ ] ❌ NO confetti animation
- [ ] ❌ NO celebration dialog
- [ ] ✅ User is authenticated normally
- [ ] ✅ `free_inference_grants.grantedAt` unchanged
- [ ] ✅ `free_inference_grants.usedCount` unchanged

#### Scenario 4: Free Inference Deduction

**Setup:**
- User with 5 free inferences available
- Ready to run inference

**Steps:**
- [ ] Navigate to `/inference/text-to-image`
- [ ] Fill form, attempt to run inference

**Expected:**
- [ ] ✅ NO payment dialog (skipped)
- [ ] ✅ Inference runs successfully
- [ ] ✅ Check DB: `inferences.isFreeInference = 1`
- [ ] ✅ Check DB: `inferences.actualCostUsdc = 0`
- [ ] ✅ Check DB: `free_inference_grants.usedCount = 1`

#### Scenario 5: Free Credits Exhaustion

**Setup:**
- User with only 1 free inference remaining
- Ready to run 2 inferences

**Steps:**
- [ ] Run inference #1 (should be free)
- [ ] Run inference #2 (should require payment)

**Expected:**
- [ ] ✅ Inference #1: no payment dialog, `isFreeInference = 1`
- [ ] ✅ Inference #2: shows payment dialog (402 response)
- [ ] ✅ Check DB: `usedCount = 2`, but `creditAmount = 5` (still valid)

#### Scenario 6: Confetti Performance

**Setup:**
- Run on various devices/browsers
- Monitor performance metrics

**Steps:**
- [ ] Connect wallet to trigger confetti
- [ ] Observe animation smoothness
- [ ] Check DevTools performance

**Expected:**
- [ ] ✅ 60 FPS animation (or graceful fallback)
- [ ] ✅ No layout shift or jank
- [ ] ✅ Memory usage < 10MB during animation

### Mobile Testing

- [ ] Dialog layout responsive on small screens
- [ ] Confetti animation works on mobile browsers
- [ ] CTA button easily tappable (44px minimum)
- [ ] No horizontal scroll

### Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari
- [ ] Chrome mobile

✅ **Phase 4 complete — All tests passing**

---

## 📚 PHASE 5: Documentation

### Step 1: Finalize CLAUDE.md

- [ ] Review all changes are documented
- [ ] All new files listed in project layout
- [ ] Free Inferences section complete
- [ ] Testing section updated
- [ ] Verify links/references are correct

### Step 2: Create Developer Notes

- [ ] `.claude/FREE_INFERENCES_DEV_NOTES.md` filled out
- [ ] Quick reference examples work
- [ ] Debugging FAQ covers common issues

### Step 3: Update README (Optional)

- [ ] Add brief feature mention in features list
- [ ] Link to `.claude/FREE_INFERENCES_DEV_NOTES.md` for developers
- [ ] Link to full spec in `FREE_INFERENCES_FEATURE.md`

### Step 4: Code Comments

- [ ] Add comments to non-obvious logic
  - [ ] In `wallet-bonus-provider.tsx` (integration logic)
  - [ ] In `free-inferences-celebration.tsx` (confetti setup)
  - [ ] In `/api/inference/route.ts` (free credit check)
- [ ] TypeScript comments for complex types
- [ ] No unnecessary comments (code should be self-documenting)

### Step 5: Final Review

- [ ] All documentation files exist and are complete
- [ ] No broken links or references
- [ ] Spelling/grammar check
- [ ] Consistency check (naming, patterns, terminology)

✅ **Phase 5 complete — Documentation done**

---

## ✅ FINAL CHECKLIST

### Code Quality
- [ ] All new code follows CLAUDE.md conventions
- [ ] TypeScript strict mode — no `any` or `@ts-ignore`
- [ ] No console.logs in production code
- [ ] Proper error handling throughout
- [ ] No hardcoded values (use env vars/constants)

### Testing
- [ ] All new code has unit tests
- [ ] All API endpoints have integration tests
- [ ] Manual testing completed (all 6 scenarios)
- [ ] `pnpm test` passes 100%
- [ ] `pnpm lint` passes with no errors

### Documentation
- [ ] CLAUDE.md updated
- [ ] `.claude/FREE_INFERENCES_DEV_NOTES.md` created
- [ ] Code comments added where needed
- [ ] README updated (optional)

### Performance
- [ ] Confetti animation < 60FPS max (lightweight)
- [ ] No unnecessary re-renders in components
- [ ] Dialog mount doesn't block page

### Security
- [ ] Balance check trusts client assertion (acceptable for v1)
- [ ] Session validation on all endpoints
- [ ] No sensitive data in logs
- [ ] Zod validation on all inputs

---

## 🚀 READY TO DEPLOY?

Once all phases are complete:

1. **Code Review:** PR review by team
2. **QA Sign-Off:** Testing team approves
3. **Staging Deployment:** Deploy to staging environment
4. **Production Deployment:** Roll out to production
5. **Monitor:** Track metrics (adoption, activation, conversion)

---

## Notes & Questions

**Open Questions to Resolve:**
- [ ] Should we notify landing page about free inferences? (drive presale clicks)
- [ ] A/B test: 5 free inferences vs. 10 vs. 20?
- [ ] Future: Should we gate based on IP (prevent abuse)?
- [ ] Future: Should we implement expiration?

**Blockers/Risks:**
- [ ] None identified — ready to proceed!

---

**Last Updated:** 2026-03-25
**Next Step:** Begin Phase 1 (Database & Backend)
