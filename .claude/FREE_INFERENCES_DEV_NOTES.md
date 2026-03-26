# Free Inferences Feature — Developer Notes

## Quick Facts
- Grants are stored in `free_inference_grants` with unique `address`.
- Free credits are applied before any paid inference charge.
- `is_free_inference` flag on `inferences` marks zero-cost runs.
- Client-side USDC balance check gates granting (trusting wagmi for v1).
- Confetti/celebration uses `canvas-confetti` inside `FreeInferencesCelebration`.

## Key Files
- Grant endpoint: `src/app/api/inferences/grant-free-credit/route.ts`
- Status endpoint: `src/app/api/inferences/free-credit-status/route.ts`
- Inference charge check: `src/app/api/inference/route.ts`
- Provider: `src/providers/wallet-bonus-provider.tsx`
- Celebration UI: `src/components/inference/free-inferences-celebration.tsx`
- Hooks: `src/hooks/use-free-credit-status.ts`, `src/hooks/use-grant-free-inferences.ts`

## Usage Flow
1) User signs in with wallet.
2) `WalletBonusProvider` reads USDC balance; if > 0, it calls grant endpoint.
3) On first grant success, celebration dialog shows and credits are stored.
4) When running inference without a payment header, server consumes available free credit before 402 payment response.
5) Each successful free inference increments `used_count` and records `is_free_inference = 1`.

## Testing Checklist
- New user with USDC balance gets `granted: true` and celebration dialog.
- Returning user receives `granted: false` and no dialog.
- Free inference request (no Payment-Signature) streams results and sets `is_free_inference=1`.
- After 5 uses, API returns 402 Payment Required for additional runs.
- Status endpoint reports `remainingCredit` correctly.

## Future Enhancements
- Add expiration handling via `expires_at`.
- Server-side USDC balance verification.
- Analytics events for grant + usage.
- A/B test credit amounts.
