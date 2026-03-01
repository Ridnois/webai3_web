"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferenceResponse } from "@/types/inference";
import { parseInferenceApiError } from "@/lib/inference-error";

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

async function requestInference(
  input: InferenceRequestInput
): Promise<PaymentRequiredResult> {
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

  // Shouldn't get 200 without payment, but handle gracefully
  throw new Error("Unexpected 200 response without payment");
}

interface SubmitInput extends InferenceRequestInput {
  paymentSignatureBase64: string;
}

async function submitInference(
  input: SubmitInput
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

  const response: InferenceResponse = await res.json();
  const settlementBase64 = res.headers.get("Payment-Response");

  return {
    phase: "complete",
    response,
    settlementBase64,
  };
}

export function useInference() {
  const queryClient = useQueryClient();

  const request = useMutation({
    mutationFn: requestInference,
  });

  const submit = useMutation({
    mutationFn: submitInference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inference-history"] });
    },
  });

  return { request, submit };
}
