"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { useGrantFreeInferences } from "@/hooks/use-grant-free-inferences";
import { toastSuccess } from "@/lib/toast";

export function WalletBonusProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, address, chainId } = useAuth();
  const { usdcRaw, isLoading } = useWalletBalances(address, chainId);
  const { grantCredit, isGranting } = useGrantFreeInferences();
  const [showCelebration, setShowCelebration] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [hasAttemptedGrant, setHasAttemptedGrant] = useState(false);

  useEffect(() => {
    setHasAttemptedGrant(false);
  }, [address]);

  useEffect(() => {
    if (!isAuthenticated || !address || !chainId || hasAttemptedGrant) return;
    if (isLoading || usdcRaw === undefined) return;

    if (usdcRaw > BigInt(0) && !isGranting) {
      setHasAttemptedGrant(true);
      grantCredit(chainId)
        .then((res) => {
          if (res.granted) {
            setCreditAmount(res.creditAmount);
            triggerCelebration(res.creditAmount);
          }
        })
        .catch(() => {
          /* silent */
        });
    } else {
      setHasAttemptedGrant(true);
    }
  }, [
    address,
    chainId,
    grantCredit,
    hasAttemptedGrant,
    isAuthenticated,
    isGranting,
    isLoading,
    usdcRaw,
  ]);

  function triggerCelebration(amount: number) {
    toastSuccess("Free inferences unlocked", `${amount} runs are now free. They’ll auto-apply on your next inference.`);
    fireConfetti();
  }

  async function fireConfetti() {
    const module = await import("canvas-confetti");
    const confetti = (module as unknown as { default: () => void }).default || (module as any);

    const duration = 2600;
    const end = Date.now() + duration;
    const defaults = { spread: 80, ticks: 200, gravity: 0.9, origin: { y: 0.65 } };

    confetti({ particleCount: 90, angle: 60, startVelocity: 40, origin: { x: 0, y: 0.7 } });
    confetti({ particleCount: 90, angle: 120, startVelocity: 40, origin: { x: 1, y: 0.7 } });

    (function frame() {
      confetti({ particleCount: 28, scalar: 1, ...defaults });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  return (
    <>{children}</>
  );
}
