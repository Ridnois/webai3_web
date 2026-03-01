"use client";

import { useQuery } from "@tanstack/react-query";

interface PlatformStats {
  totalInferences: number;
  totalTimeMs: number;
  totalUsers: number;
}

async function fetchStats(): Promise<PlatformStats> {
  const res = await fetch("/api/stats");
  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }
  return res.json();
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: fetchStats,
  });
}
