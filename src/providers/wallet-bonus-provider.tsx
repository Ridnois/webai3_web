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
  }

  return (
    <>{children}</>
  );
}
