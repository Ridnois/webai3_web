"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

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
    const body = await res.json().catch(() => ({}));
    const message = typeof body.error === "string" ? body.error : "Request failed";

    if (res.status === 401) {
      throw new Error("Sign in required to view this inference");
    }
    if (res.status === 404) {
      throw new Error("Inference not found");
    }
    if (res.status === 403) {
      throw new Error("You do not have permission to view this inference");
    }
    throw new Error(`Failed to fetch inference detail (${res.status}): ${message}`);
  }
  return res.json();
}

export function useInferenceDetail(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["inference-detail", id],
    queryFn: () => fetchInferenceDetail(id),
    enabled: isAuthenticated && Boolean(id),
  });
}
