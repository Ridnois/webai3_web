"use client";

import { useQuery } from "@tanstack/react-query";
import type { TaskType } from "@/types/inference";

interface CostEstimate {
  task: TaskType;
  estimatedCostUsdc: number;
  ratePerSec: number;
  estimatedSeconds: number;
  source: "historical" | "default";
}

async function fetchCostEstimate(task: TaskType): Promise<CostEstimate> {
  const res = await fetch(`/api/inference/estimate?task=${task}`);
  if (!res.ok) {
    throw new Error("Failed to fetch cost estimate");
  }
  return res.json();
}

export function useCostEstimate(task: TaskType) {
  return useQuery({
    queryKey: ["cost-estimate", task],
    queryFn: () => fetchCostEstimate(task),
    staleTime: 60_000,
  });
}
