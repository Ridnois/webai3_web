"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface AdminUser {
  address: string;
  totalInferences: number;
  succeededCount: number;
  failedCount: number;
  totalSpentUsdc: number;
  avgResponseMs: number | null;
  lastInference: string | null;
  firstInference: string | null;
  freeInferences: number;
  textToImage: number;
  textToText: number;
  textToSound: number;
  uniqueModels: number;
  joinedAt: string | null;
  lastSeenAt: string | null;
  freeCreditsTotal: number;
  freeCreditsUsed: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

async function fetchAdminUsers(): Promise<AdminUsersResponse> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) {
    throw new Error("Failed to fetch admin users");
  }
  return res.json();
}

export function useAdminUsers() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });
}
