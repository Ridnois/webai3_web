"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

async function toggleShare(id: string, isPublic: boolean): Promise<{ id: string; isPublic: boolean }> {
  const res = await fetch(`/api/inferences/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublic }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update sharing");
  }

  return res.json();
}

export function useShareInference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      toggleShare(id, isPublic),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inference-detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["inference-history"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}
