"use client";

import { useQuery } from "@tanstack/react-query";
import type { TaskType } from "@/types/inference";

interface CostEstimate {
  task: TaskType;
  model: string | null;
  estimatedCostUsdc: number;
  ratePerSec: number;
  estimatedSeconds: number;
  source: "model" | "historical" | "default";
}

async function fetchCostEstimate(task: TaskType, model?: string): Promise<CostEstimate> {
  const params = new URLSearchParams({ task });
  if (model) params.set("model", model);

  const res = await fetch(`/api/inference/estimate?${params}`);
  if (!res.ok) {
    throw new Error("Failed to fetch cost estimate");
  }
  return res.json();
}

export function useCostEstimate(task: TaskType, model?: string) {
  return useQuery({
    queryKey: ["cost-estimate", task, model ?? null],
    queryFn: () => fetchCostEstimate(task, model),
    staleTime: 60_000,
  });
}
