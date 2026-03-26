"use client";

import { cn } from "@/lib/utils";

export function ModelTierPill({ tier }: { tier: "pro" | "fast" | "balanced" }) {
  const label = tier === "pro" ? "Pro" : tier === "fast" ? "Fast" : "Balanced";
  const colors: Record<typeof tier, string> = {
    pro: "bg-amber-500/20 text-amber-900 dark:text-amber-50",
    fast: "bg-emerald-500/20 text-emerald-900 dark:text-emerald-50",
    balanced: "bg-blue-500/20 text-blue-900 dark:text-blue-50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.08em]",
        colors[tier]
      )}
    >
      {label}
    </span>
  );
}
