# Free Inferences Feature — Documentation Hub

**Status:** Technical Design Complete ✅ Ready for Implementation
**Created:** 2026-03-25
**Version:** 1.0

---

## 📋 Overview

This directory contains all technical documentation for the **Free Inferences feature** — a new incentive that grants 5 free AI inferences to new users who connect their wallet and have USDC balance.

### What This Feature Does

✨ **User Experience:**
- User connects wallet for the first time
- System detects USDC balance
- If balance > 0: User sees celebratory confetti animation + modal dialog
- User gets 5 free inferences to try the platform
- Free inferences are deducted before paid USDC charges

🎯 **Business Value:**
- Reduces friction for new users
- Increases activation (more users running inferences)
- Drives conversion from free → paid users
- Builds loyalty through welcome gift

---

## 📚 Documentation Structure

### 1. **FREE_INFERENCES_FEATURE.md** — Full Specification
**Read this if you need:** Complete technical design, architecture, implementation details

**Contains:**
- Feature overview & goals
- Functional & non-functional requirements
- Complete database schema changes
- All API endpoint specifications (request/response)
- Frontend component & hook designs
- Integration points with existing code
- Environment variables & configuration
- Testing strategy with examples
- Risk mitigation & rollback plan
- Future enhancements
- Decision matrix (balance check, expiration, storage)

**Length:** ~800 lines
**Time to Read:** 30-45 minutes

---

### 2. **DEV_DOCS_UPDATES.md** — Documentation Changes BEFORE Code
**Read this if you need:** Exact changes to make in CLAUDE.md and project docs

**Contains:**
- What to add to CLAUDE.md (with exact text)
- New section for free inferences system
- Database schema updates
- API endpoint documentation format
- Testing section updates
- `.claude/FREE_INFERENCES_DEV_NOTES.md` content
- Optional public documentation

**Length:** ~300 lines
**Time to Read:** 15 minutes
**Action:** These docs must be updated BEFORE writing any code

---

### 3. **IMPLEMENTATION_CHECKLIST.md** — Step-by-Step Tasks
**Read this if you need:** A runnable checklist for each phase

**Contains:**
- Phase 1: Database & Backend (database, APIs, endpoint integration)
- Phase 2: Frontend Components & Hooks (UI, animations, interaction)
- Phase 3: Integration & Providers (plumbing, routing, state management)
- Phase 4: Testing & Validation (unit tests, manual scenarios, QA)
- Phase 5: Documentation (final updates, code comments, review)
- Final checklist (code quality, testing, security, performance)

**Length:** ~450 lines
**Time to Read:** 10 minutes per phase
**Action:** Follow this checklist sequentially; each phase builds on previous

---

### 4. **FREE_INFERENCES_DEV_NOTES.md** — Quick Reference
**Read this if you need:** Fast lookup while developing

**Contains:**
- Quick overview (5 bullet points)
- Key components table with file paths
- Typical development task code examples
- Common debugging FAQ
- Testing checklist (compact version)
- Future enhancements list

**Length:** ~150 lines
**Time to Read:** 5 minutes

---

## 🚀 Quick Start Path

### For Project Managers / Team Leads

**Read in order:**
1. This file (README_FREE_INFERENCES.md)
2. `FREE_INFERENCES_FEATURE.md` — Overview + Goals sections
3. `IMPLEMENTATION_CHECKLIST.md` — Skim the 5 phases to understand scope

**Time:** 20 minutes

### For Developers (Before Starting)

**Read in order:**
1. This file (README_FREE_INFERENCES.md)
2. `CLAUDE.md` in the project (existing documentation)
3. `FREE_INFERENCES_FEATURE.md` — Full specification
4. `DEV_DOCS_UPDATES.md` — Update project docs BEFORE coding

**Time:** 60 minutes (includes reading existing CLAUDE.md)

### For Developers (During Implementation)

**Keep open:**
1. `IMPLEMENTATION_CHECKLIST.md` — Your runnable tasks
2. `.claude/FREE_INFERENCES_DEV_NOTES.md` — Quick reference
3. `FREE_INFERENCES_FEATURE.md` — Detailed reference

---

## 📌 Key Decisions (Pre-Made)

These decisions have already been made in the spec. No need to re-discuss:

| Decision | Choice | Why |
|---|---|---|
| **Balance Check** | Client-side (trust Wagmi) | Speed + UX. Can switch to server-side RPC if abuse occurs. |
| **Credit Expiration** | No expiration (v1) | Simpler, user-friendly. Add expiration in future version. |
| **Storage** | Add `isFreeInference` column to inferences table | Single source of truth, easy auditing. |
| **Idempotency** | Tracked in `free_inference_grants` table, unique address constraint | Prevent duplicate grants on reconnect. |
| **Animation Library** | `canvas-confetti` | Lightweight (~2KB gzipped), battle-tested. |
| **Dialog Component** | shadcn/ui Dialog | Consistent with existing UI, accessible. |

---

## 🔄 Recommended Implementation Flow

### Week 1: Planning & Documentation ✅
- [x] Write technical specification
- [x] Design database schema
- [x] Design API contracts
- [x] Design frontend components
- [ ] Team review & approval
- [ ] Create JIRA/Linear tickets (Phases 1-5)

### Week 2: Phase 1 — Backend Foundation
- [ ] Update documentation (`CLAUDE.md`, dev notes)
- [ ] Generate and apply DB migrations
- [ ] Implement grant and status endpoints
- [ ] Integrate free credit check into inference endpoint
- [ ] Write tests
- [ ] Code review

### Week 3: Phase 2 & 3 — Frontend & Integration
- [ ] Create hooks (`use-free-credit-status`, `use-grant-free-inferences`)
- [ ] Create components (`FreeInferencesCelebration`)
- [ ] Create provider (`WalletBonusProvider`)
- [ ] Integrate into root layout
- [ ] Write tests
- [ ] Code review

### Week 4: Phase 4 — Testing & Validation
- [ ] Run all unit tests
- [ ] Execute 6 manual test scenarios
- [ ] Performance testing (confetti animation)
- [ ] Mobile & browser compatibility
- [ ] QA sign-off

### Week 5: Phase 5 — Documentation & Deployment
- [ ] Finalize all documentation
- [ ] Code review round 2
- [ ] Staging deployment
- [ ] Final QA
- [ ] Production release
- [ ] Monitor metrics

---

## 💾 Files Modified / Created

### Configuration Files
- `package.json` — Add `canvas-confetti` dependency

### Database
- `src/lib/db/schema.ts` — Add 3 new/modified tables
- `drizzle/` — Auto-generated migrations

### API Routes
- `src/app/api/inferences/grant-free-credit/route.ts` — NEW
- `src/app/api/inferences/free-credit-status/route.ts` — NEW
- `src/app/api/inference/route.ts` — MODIFIED (add free credit check)

### Hooks
- `src/hooks/use-free-credit-status.ts` — NEW
- `src/hooks/use-grant-free-inferences.ts` — NEW

### Components
- `src/components/inference/free-inferences-celebration.tsx` — NEW
- `src/components/wallet/first-time-wallet-bonus.tsx` — NEW (optional)

### Providers
- `src/providers/wallet-bonus-provider.tsx` — NEW
- `src/app/layout.tsx` — MODIFIED (wrap with provider)

### Tests
- `src/hooks/use-free-credit-status.test.ts` — NEW
- `src/hooks/use-grant-free-inferences.test.ts` — NEW
- `src/app/api/inferences/grant-free-credit/route.test.ts` — NEW
- `src/app/api/inferences/free-credit-status/route.test.ts` — NEW
- `src/app/api/inference/route.test.ts` — MODIFIED (add test cases)
- `src/components/inference/free-inferences-celebration.test.tsx` — NEW

### Documentation
- `CLAUDE.md` — MODIFIED (add feature documentation)
- `FREE_INFERENCES_FEATURE.md` — NEW (this directory)
- `.claude/DEV_DOCS_UPDATES.md` — NEW (this directory)
- `.claude/FREE_INFERENCES_DEV_NOTES.md` — NEW (this directory)
- `.claude/IMPLEMENTATION_CHECKLIST.md` — NEW (this directory)
- `.claude/README_FREE_INFERENCES.md` — NEW (this file)

**Total:** ~25 files created/modified

---

## ⚠️ Critical Path Dependencies

**Phase 1 must complete before Phase 2:**
- Endpoints must exist for hooks to call
- Database schema must be set up for insertion

**Phase 2 must complete before Phase 3:**
- Components must exist to render
- Hooks must exist for integration

**Phase 3 must complete before Phase 4:**
- Provider must be wired for testing
- Layout must be updated

**Phase 4 must complete before Phase 5:**
- Code must be passing tests
- Features must work end-to-end

---

## 🎯 Success Criteria

### Launch Criteria (All Must Be True)
- [x] Technical specification complete (this document)
- [ ] All code follows CLAUDE.md conventions
- [ ] All new code has unit tests (>80% coverage)
- [ ] All 6 manual test scenarios pass
- [ ] `pnpm test` and `pnpm lint` pass 100%
- [ ] CLAUDE.md updated with new sections
- [ ] Staging deployment successful
- [ ] QA sign-off received

### Post-Launch Metrics (Track After Release)
- [ ] % of new users who claim free inferences
- [ ] % of free-credit users who run inference
- [ ] % conversion to paid users
- [ ] Average free inferences used per user
- [ ] Cost per activation (free inferences ÷ new users)

---

## 🔗 Integration Points Checklist

**Make sure these work together:**

- [ ] Auth flow → triggers WalletBonusProvider logic ✓
- [ ] WalletBonusProvider → checks balance via useWalletBalances ✓
- [ ] useGrantFreeInferences → calls POST /api/inferences/grant-free-credit ✓
- [ ] grant-free-credit endpoint → creates record in freeInferenceGrants ✓
- [ ] Inference endpoint → checks freeInferenceGrants before payment ✓
- [ ] FreeInferencesCelebration → shows on grant success ✓
- [ ] Confetti animation → plays during dialog display ✓
- [ ] CTA button → navigates to /inference page ✓

---

## 🐛 Debugging Help

### "User doesn't see celebration dialog"
1. Check: User has USDC balance > 0
2. Check: POST /api/inferences/grant-free-credit response in Network tab
3. Check: Console for errors
4. Check: `free_inference_grants` table in Drizzle Studio

### "Free credits aren't being deducted"
1. Check: Inference endpoint calls query on `freeInferenceGrants`
2. Check: `usedCount` is actually incrementing in DB
3. Check: `isFreeInference` flag is being set to 1

### "Confetti animation is laggy"
1. Check: Device GPU performance
2. Check: Browser tab is in focus (animations pause when not)
3. Reduce animation duration (currently 3-5 seconds)

See `FREE_INFERENCES_DEV_NOTES.md` for more debugging scenarios.

---

## 📞 Questions?

Refer to the appropriate document:

- **"How should I implement this?"** → IMPLEMENTATION_CHECKLIST.md
- **"What's the complete design?"** → FREE_INFERENCES_FEATURE.md
- **"What code do I write?"** → FREE_INFERENCES_DEV_NOTES.md (examples) + Specification (details)
- **"What needs to change in docs?"** → DEV_DOCS_UPDATES.md
- **"What are the decisions?"** → This file (Key Decisions section)

---

## ✅ Checklist Before Starting Code

- [ ] Read `FREE_INFERENCES_FEATURE.md` completely
- [ ] Read existing `CLAUDE.md` to understand project structure
- [ ] Understand the 3 key tables: `users`, `inferences`, `freeInferenceGrants`
- [ ] Understand the 2 new API endpoints (grant, status)
- [ ] Understand the provider → component → hook flow
- [ ] Review database schema changes carefully
- [ ] Get team approval on design
- [ ] Create tickets/stories for each phase
- [ ] Set up branch/PR naming convention
- [ ] Schedule code review time with team

---

## 📖 Document Versions

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-03-25 | Team | Initial technical specification |

---

**Next Step:** Team lead reviews this document, assigns implementation tasks, and team begins Phase 1 (database & backend).

**Estimated Total Time:** 4-5 weeks (including reviews and testing)
