"use client";

import { Sparkles } from "lucide-react";
import { useFreeCreditStatus } from "@/hooks/use-free-credit-status";
import { cn } from "@/lib/utils";

interface FreeCreditBannerProps {
  variant?: "bar" | "pill";
  showDefault?: boolean;
  className?: string;
}

export function FreeCreditBanner({
  variant = "bar",
  showDefault = true,
  className,
}: FreeCreditBannerProps) {
  const { status, isLoading } = useFreeCreditStatus();

  if (isLoading) return null;

  if (status && status.remainingCredit > 0) {
    const label = `${status.remainingCredit} free inference${status.remainingCredit === 1 ? "" : "s"} left`;
    if (variant === "pill") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-900 dark:text-emerald-50 dark:bg-emerald-500/20",
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
          "flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-900 dark:text-emerald-50 dark:bg-emerald-500/15",
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
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-950",
          className,
        )}
      >
        <Sparkles className="size-3.5" />
        5 free inferences for new users
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-200/50 px-4 py-3 text-sm font-semibold text-amber-950 shadow-[0_10px_30px_-18px] shadow-amber-500/30",
        className,
      )}
    >
      <Sparkles className="size-4" />
      5 free inferences for new users
    </div>
  );
}
