"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface ModelInference {
  id: string;
  createdAt: string;
  predictTimeMs: number | null;
  status: "pending" | "succeeded" | "failed";
  actualCostUsdc: number | null;
  userAddress: string;
}

async function fetchModelInferences(model: string): Promise<ModelInference[]> {
  const res = await fetch(`/api/admin/model-inferences?model=${encodeURIComponent(model)}`);
  if (!res.ok) throw new Error("Failed to fetch model inferences");
  return res.json();
}

export function useModelInferences(model: string | null) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["admin-model-inferences", model],
    queryFn: () => fetchModelInferences(model!),
    enabled: isAdmin && model !== null,
    staleTime: 30_000,
  });
}
