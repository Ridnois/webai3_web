"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface ModelMetric {
  model: string;
  totalCalls: number;
  successCount: number;
  failedCount: number;
  avgResponseMs: number | null;
  totalRevenueUsdc: number;
  lastUsed: string | null;
}

interface MetricsSummary {
  totalInferences: number;
  uniqueModels: number;
  uniqueUsers: number;
  avgResponseMs: number | null;
  totalTimeMs: number;
  totalRevenueUsdc: number;
  totalEstimatedUsdc: number;
}

export interface AdminMetricsResponse {
  models: ModelMetric[];
  summary: MetricsSummary;
}

async function fetchAdminMetrics(): Promise<AdminMetricsResponse> {
  const res = await fetch("/api/admin/metrics");
  if (!res.ok) {
    throw new Error("Failed to fetch admin metrics");
  }
  return res.json();
}

export function useAdminMetrics() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["admin-metrics"],
    queryFn: fetchAdminMetrics,
    enabled: isAdmin,
  });
}
