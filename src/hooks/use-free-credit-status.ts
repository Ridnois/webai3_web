"use client";

import { useQuery } from "@tanstack/react-query";

interface FreeCreditStatus {
  hasFreeCredit: boolean;
  remainingCredit: number;
  grantedAt: string | null;
  expiresAt: string | null;
}

interface UseFreeCreditStatusReturn {
  status: FreeCreditStatus | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchFreeCreditStatus(): Promise<FreeCreditStatus | null> {
  const res = await fetch("/api/inferences/free-credit-status");
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error("Failed to fetch free credit status");
  }
  return res.json();
}

export function useFreeCreditStatus(): UseFreeCreditStatusReturn {
  const query = useQuery({
    queryKey: ["free-credit-status"],
    queryFn: fetchFreeCreditStatus,
    staleTime: 60_000,
  });

  return {
    status: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
