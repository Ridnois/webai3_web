"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useFreeCreditStatus } from "@/hooks/use-free-credit-status";
import { useConnect, useAccount } from "wagmi";
import { useAuth } from "@/hooks/use-auth";
import { addAndSwitchToSepolia } from "@/lib/wallet-network";
import { defaultChain } from "@/lib/wagmi";

export function FreeCreditFloatHome() {
  const { isAuthenticated, signIn } = useAuth();
  const { status, isLoading } = useFreeCreditStatus();
  const { connectors, connectAsync, isPending } = useConnect();
  const { chain } = useAccount();
  const [isBusy, setIsBusy] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (status && status.remainingCredit === 0) setIsVisible(false);
  }, [isAuthenticated, status]);

  const quickConnector =
    connectors.find((c) => c.ready) ?? connectors.find((c) => c.id === "injected") ?? connectors[0];

  const show =
    isVisible &&
    !isLoading &&
    (!status || status.remainingCredit > 0) &&
    (!isAuthenticated || (status ? status.remainingCredit > 0 : true));

  async function handleClick() {
    if (!quickConnector) return;
    setIsBusy(true);
    try {
      const res = await connectAsync({ connector: quickConnector });
      const targetChain = defaultChain.id;
      if (res.chainId !== targetChain && targetChain === 11155111) {
        await addAndSwitchToSepolia();
      }
      await signIn();
      setIsVisible(false);
    } catch (e) {
      console.error("[free-credit-float-home] connect failed", e);
    } finally {
      setIsBusy(false);
    }
  }

  if (!show) return null;

  return (
    <button
      onClick={handleClick}
      disabled={isBusy || isPending}
      className="group absolute right-2 top-2 flex items-center gap-2 rounded-full border border-cyan-200/70 bg-gradient-to-r from-indigo-500/80 via-fuchsia-500/80 to-amber-400/80 px-3.5 py-2 text-[11px] font-semibold text-white shadow-[0_16px_40px_-18px_rgba(59,130,246,0.5)] transition hover:-translate-y-[2px] hover:shadow-[0_18px_46px_-16px_rgba(244,114,182,0.55)] animate-[floatPulse_3s_ease-in-out_infinite]"
      style={{ filter: "saturate(1.05)" }}
      aria-label="Claim free inferences"
    >
      <Sparkles className="size-4 shrink-0 drop-shadow" />
      <span className="whitespace-nowrap drop-shadow">
        {status?.remainingCredit ? `${status.remainingCredit} free left` : "Claim 5 free runs"}
      </span>
      <ArrowUpRight className="size-4 shrink-0 transition group-hover:translate-x-[2px]" />
    </button>
  );
}
