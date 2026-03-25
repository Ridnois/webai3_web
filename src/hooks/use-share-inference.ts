"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastSuccess, toastError } from "@/lib/toast";

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

/** Standard success/error toast callbacks for share toggle mutations. */
export function shareToggleCallbacks(onSuccess?: (result: { isPublic: boolean }) => void) {
  return {
    onSuccess: (result: { id: string; isPublic: boolean }) => {
      toastSuccess(
        result.isPublic ? "Shared to gallery" : "Removed from gallery",
        result.isPublic
          ? "Anyone with the link can now view this result."
          : "This result is now private and hidden from the gallery.",
      );
      onSuccess?.(result);
    },
    onError: (err: Error) => {
      toastError("Sharing failed", {
        description: err.message,
        hint: "Check your connection and try again.",
      });
    },
  };
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
