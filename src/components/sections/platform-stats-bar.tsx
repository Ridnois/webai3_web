"use client";

import { usePlatformStats } from "@/hooks/use-platform-stats";

export function PlatformStatsBar() {
  const { data: stats } = usePlatformStats();
  if (!stats) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-semibold text-primary">
          {stats.totalInferences.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground/50">inferences</span>
      </div>
      <div className="h-3 w-px bg-border/40" />
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-semibold text-primary">
          {stats.totalUsers.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground/50">wallets</span>
      </div>
      <div className="h-3 w-px bg-border/40" />
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-semibold text-primary">
          {(stats.totalTimeMs / 1000).toFixed(0)}s
        </span>
        <span className="text-[10px] text-muted-foreground/50">compute</span>
      </div>
    </div>
  );
}
