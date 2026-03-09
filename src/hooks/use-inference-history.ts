"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface InferenceHistoryItem {
  id: string;
  taskType: string;
  model: string;
  outputType: string;
  status: string;
  predictTimeMs: number | null;
  isPublic: number;
  createdAt: string;
}

interface InferenceHistoryResponse {
  items: InferenceHistoryItem[];
  page: number;
  limit: number;
}

async function fetchHistory(page: number): Promise<InferenceHistoryResponse> {
  const res = await fetch(`/api/inferences?page=${page}&limit=20`);
  if (!res.ok) {
    throw new Error("Failed to fetch history");
  }
  return res.json();
}

export function useInferenceHistory(page = 1) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["inference-history", page],
    queryFn: () => fetchHistory(page),
    enabled: isAuthenticated,
  });
}
