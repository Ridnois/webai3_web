"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface UserStatsSummary {
  totalInferences: number;
  successCount: number;
  failedCount: number;
  totalTimeMs: number;
  avgResponseMs: number | null;
  modelsUsed: number;
  lastInference: string | null;
  totalSpentUsdc: number;
  totalEstimatedUsdc: number;
}

interface ModelBreakdown {
  model: string;
  totalCalls: number;
  successCount: number;
  avgResponseMs: number | null;
  lastUsed: string | null;
}

interface TaskBreakdown {
  taskType: string;
  totalCalls: number;
}

export interface UserStatsResponse {
  summary: UserStatsSummary;
  byModel: ModelBreakdown[];
  byTask: TaskBreakdown[];
}

async function fetchUserStats(): Promise<UserStatsResponse> {
  const res = await fetch("/api/user/stats");
  if (!res.ok) {
    throw new Error("Failed to fetch user stats");
  }
  return res.json();
}

export function useUserStats() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["user-stats"],
    queryFn: fetchUserStats,
    enabled: isAuthenticated,
  });
}
