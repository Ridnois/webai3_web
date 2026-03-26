"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { useGrantFreeInferences } from "@/hooks/use-grant-free-inferences";
import confetti from "canvas-confetti";
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

  function fireConfetti() {
    const duration = 2500;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        ticks: 160,
        scalar: 0.9,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  return (
    <>{children}</>
  );
}
