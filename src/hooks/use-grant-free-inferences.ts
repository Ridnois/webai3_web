"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface GrantResponse {
  granted: boolean;
  creditAmount: number;
  message: string;
}

interface UseGrantFreeInferencesReturn {
  grantCredit: (chainId: number) => Promise<GrantResponse>;
  isGranting: boolean;
  error: Error | null;
}

async function grantFreeInferences(chainId: number): Promise<GrantResponse> {
  const res = await fetch("/api/inferences/grant-free-credit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chainId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to grant free inferences");
  }

  return res.json();
}

export function useGrantFreeInferences(): UseGrantFreeInferencesReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: grantFreeInferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["free-credit-status"] });
    },
  });

  return {
    grantCredit: (chainId) => mutation.mutateAsync(chainId),
    isGranting: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
