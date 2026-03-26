"use client";

import { Sparkles } from "lucide-react";
import { useFreeCreditStatus } from "@/hooks/use-free-credit-status";
import { cn } from "@/lib/utils";
import { FreeCreditCriteriaDialog } from "@/components/free-credit-criteria-dialog";

interface FreeCreditBannerProps {
  variant?: "bar" | "pill";
  showDefault?: boolean;
  className?: string;
  onClick?: () => void;
}

export function FreeCreditBanner({
  variant = "bar",
  showDefault = true,
  className,
  onClick,
}: FreeCreditBannerProps) {
  const { status, isLoading } = useFreeCreditStatus();

  if (isLoading) return null;

  if (status && status.remainingCredit > 0) {
    const label = `${status.remainingCredit} free inference${status.remainingCredit === 1 ? "" : "s"} left`;
    if (variant === "pill") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-900 dark:text-emerald-50 dark:bg-emerald-500/15",
            className,
          )}
        >
          <Sparkles className="size-3.5" />
          {label}
        </span>
      );
    }

    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm font-semibold text-emerald-950 dark:text-emerald-50 dark:bg-emerald-500/15",
          className,
        )}
      >
        <Sparkles className="size-4" />
        {label}
      </div>
    );
  }

  if (status && status.remainingCredit === 0) {
    return null; // exhausted — hide promo
  }

  if (!showDefault) return null;

  // Default promo
  if (variant === "pill") {
    const pill = (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15",
          className,
        )}
      >
        <Sparkles className="size-3.5" />
        5 free inferences for new users
      </span>
    );
    return onClick ? pill : <FreeCreditCriteriaDialog trigger={pill} />;
  }

  const bar = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/8 px-3.5 py-2.5 text-sm font-semibold text-primary shadow-[0_12px_32px_-18px] shadow-primary/25",
        className,
      )}
    >
      <Sparkles className="size-4" />
      5 free inferences for new users
    </div>
  );

  return onClick ? bar : <FreeCreditCriteriaDialog trigger={bar} />;
}
