"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface ModelMetric {
  model: string;
  taskType: string;
  totalCalls: number;
  successCount: number;
  failedCount: number;
  avgResponseMs: number | null;
  totalRevenueUsdc: number;
  lastUsed: string | null;
}

export interface MetricsSummary {
  totalInferences: number;
  uniqueModels: number;
  uniqueUsers: number;
  avgResponseMs: number | null;
  totalTimeMs: number;
  totalRevenueUsdc: number;
  totalEstimatedUsdc: number;
  succeededCount: number;
  failedCount: number;
}

export interface TaskBreakdownItem {
  taskType: string;
  count: number;
  revenue: number;
}

export interface DailyMetric {
  date: string;
  total: number;
  succeeded: number;
  failed: number;
  revenue: number;
  textToImage: number;
  textToText: number;
  textToSound: number;
}

export interface AdminMetricsResponse {
  models: ModelMetric[];
  summary: MetricsSummary;
  taskBreakdown: TaskBreakdownItem[];
  dailyMetrics: DailyMetric[];
  hourlyMetrics: DailyMetric[]; // same shape, date is ISO hour string
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
    refetchInterval: 60_000,
  });
}
