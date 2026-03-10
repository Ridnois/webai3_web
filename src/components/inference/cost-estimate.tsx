"use client";

import { formatUsdc } from "@/lib/pricing";
import { useCostEstimate } from "@/hooks/use-cost-estimate";
import type { TaskType } from "@/types/inference";

interface CostEstimateProps {
  task: TaskType;
  model?: string;
  usdcBalance: string | undefined;
}

export function CostEstimate({ task, model, usdcBalance }: CostEstimateProps) {
  const { data, isLoading } = useCostEstimate(task, model);

  if (isLoading || !data) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Estimating cost...
      </div>
    );
  }

  const balanceNum = usdcBalance ? parseFloat(usdcBalance) : 0;
  const insufficient = balanceNum < data.estimatedCostUsdc;

  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Estimated cost</span>
        <span className="font-medium">{formatUsdc(data.estimatedCostUsdc)}</span>
      </div>
      {usdcBalance !== undefined && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground">USDC balance</span>
          <span className={insufficient ? "font-medium text-destructive" : "font-medium"}>
            ${usdcBalance}
          </span>
        </div>
      )}
      {insufficient && (
        <p className="mt-1 text-destructive">Insufficient USDC balance</p>
      )}
    </div>
  );
}
