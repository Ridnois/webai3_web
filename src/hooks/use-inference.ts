"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferenceResponse } from "@/types/inference";
import { parseInferenceApiError } from "@/lib/inference-error";

export type InferencePhase = "verifying" | "settling" | "running" | null;

interface InferenceRequestInput {
  model: string;
  task: string;
  input: Record<string, unknown>;
}

interface PaymentRequiredResult {
  phase: "payment-required";
  paymentRequirementsBase64: string;
  estimatedCostUsdc: number;
}

interface InferenceCompleteResult {
  phase: "complete";
  response: InferenceResponse;
  settlementBase64: string | null;
}

type RequestResult = PaymentRequiredResult | InferenceCompleteResult;

async function readInferenceStream(
  res: Response,
  onPhase: (phase: InferencePhase) => void
): Promise<InferenceCompleteResult> {
  if (!res.body) throw new Error("No response body from inference API");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: InferenceCompleteResult | null = null;
  let streamError: Error | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let event: Record<string, unknown>;
        try {
          event = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        const phase = event.phase as string;

        if (phase === "verifying" || phase === "settling" || phase === "running") {
          onPhase(phase as InferencePhase);
        } else if (phase === "done") {
          result = {
            phase: "complete",
            response: event.result as InferenceResponse,
            settlementBase64: (event.settlementBase64 as string | null) ?? null,
          };
        } else if (phase === "error") {
          streamError = new Error((event.error as string) ?? "Inference failed");
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (streamError) throw streamError;
  if (!result) throw new Error("Stream ended without a result");
  return result;
}

async function requestInference(
  input: InferenceRequestInput,
  onPhase: (phase: InferencePhase) => void
): Promise<RequestResult> {
  const res = await fetch("/api/inference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (res.status === 402) {
    const paymentRequirementsBase64 = res.headers.get("Payment-Required");
    if (!paymentRequirementsBase64) {
      throw new Error("402 response missing Payment-Required header");
    }
    const body = await res.json().catch(() => ({}));
    return {
      phase: "payment-required",
      paymentRequirementsBase64,
      estimatedCostUsdc: body.estimatedCostUsdc ?? 0,
    };
  }

  if (!res.ok) {
    throw await parseInferenceApiError(res, "Request failed", "request");
  }

  return readInferenceStream(res, onPhase);
}

interface SubmitInput extends InferenceRequestInput {
  paymentSignatureBase64: string;
}

async function submitInference(
  input: SubmitInput,
  onPhase: (phase: InferencePhase) => void
): Promise<InferenceCompleteResult> {
  const { paymentSignatureBase64, ...body } = input;

  const res = await fetch("/api/inference", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Payment-Signature": paymentSignatureBase64,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await parseInferenceApiError(res, "Inference failed", "submit");
  }

  return readInferenceStream(res, onPhase);
}

export function useInference() {
  const queryClient = useQueryClient();
  const [inferencePhase, setInferencePhase] = useState<InferencePhase>(null);
  const [lastResult, setLastResult] = useState<InferenceCompleteResult | null>(null);

  const request = useMutation({
    mutationFn: (input: InferenceRequestInput) => requestInference(input, setInferencePhase),
    onSuccess: (data) => {
      if (data.phase === "complete") {
        setLastResult(data);
        setInferencePhase(null);
        queryClient.invalidateQueries({ queryKey: ["inference-history"] });
      }
    },
    onError: () => {
      setInferencePhase(null);
    },
  });

  const submit = useMutation({
    mutationFn: (input: SubmitInput) => submitInference(input, setInferencePhase),
    onSuccess: (data) => {
      setLastResult(data);
      setInferencePhase(null);
      queryClient.invalidateQueries({ queryKey: ["inference-history"] });
    },
    onError: () => {
      setInferencePhase(null);
    },
  });

  const resetResult = () => setLastResult(null);

  return { request, submit, inferencePhase, result: lastResult?.response, resetResult };
}
