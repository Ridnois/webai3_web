"use client";

import { useQuery } from "@tanstack/react-query";

export interface InferenceDetail {
  id: string;
  userAddress: string;
  taskType: string;
  model: string;
  input: Record<string, unknown>;
  outputType: string;
  outputData: unknown;
  r2Keys: string[] | null;
  status: string;
  errorMessage: string | null;
  predictTimeMs: number | null;
  createdAt: string;
  mediaUrls: string[] | null;
}

async function fetchInferenceDetail(id: string): Promise<InferenceDetail> {
  const res = await fetch(`/api/inferences/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch inference detail");
  }
  return res.json();
}

export function useInferenceDetail(id: string) {
  return useQuery({
    queryKey: ["inference-detail", id],
    queryFn: () => fetchInferenceDetail(id),
    enabled: Boolean(id),
  });
}
