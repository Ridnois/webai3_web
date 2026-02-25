import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferenceRequest, InferenceResponse } from "@/types/inference";

async function runInference(
  request: InferenceRequest
): Promise<InferenceResponse> {
  const res = await fetch("/api/inference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Inference failed (${res.status})`);
  }
  return res.json();
}

export function useInference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runInference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inference-history"] });
    },
  });
}
