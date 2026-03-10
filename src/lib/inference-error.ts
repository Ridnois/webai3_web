type InferencePhase = "request" | "submit";

interface InferenceApiErrorBody {
  error?: unknown;
  code?: unknown;
  reason?: unknown;
  details?: unknown;
}

export class InferenceApiError extends Error {
  status: number;
  code: string | null;
  hint: string | null;
  phase: InferencePhase;
  details?: unknown;

  constructor({
    message,
    status,
    code,
    hint,
    phase,
    details,
  }: {
    message: string;
    status: number;
    code: string | null;
    hint: string | null;
    phase: InferencePhase;
    details?: unknown;
  }) {
    super(message);
    this.name = "InferenceApiError";
    this.status = status;
    this.code = code;
    this.hint = hint;
    this.phase = phase;
    this.details = details;
  }
}

function inferHint(
  status: number,
  code: string | null,
  message: string,
  reason: string | null
): string | null {
  if (status === 401) {
    return "Your wallet session may have expired. Sign in again and retry.";
  }

  if (code === "MODEL_NOT_FOUND" || (status === 404 && message.toLowerCase().includes("model"))) {
    return "This model has been removed or renamed on Replicate. Choose a different model and try again.";
  }

  if (status === 402 && code === "PAYMENT_INVALID") {
    const lower = message.toLowerCase();
    if (
      lower.includes("insufficient") ||
      lower.includes("balance") ||
      lower.includes("allowance")
    ) {
      return "Insufficient funds or payment authorization. Top up USDC and try again.";
    }
    return "The payment authorization was rejected. Re-sign in your wallet and retry.";
  }

  if (status >= 500) {
    return reason ?? "Server-side failure. Wait a moment and retry.";
  }

  return null;
}

export async function parseInferenceApiError(
  res: Response,
  fallbackMessage: string,
  phase: InferencePhase
): Promise<InferenceApiError> {
  const body = (await res.json().catch(() => ({}))) as InferenceApiErrorBody;
  const message =
    typeof body.error === "string"
      ? body.error
      : `${fallbackMessage} (${res.status})`;
  const code = typeof body.code === "string" ? body.code : null;
  const reason = typeof body.reason === "string" ? body.reason : null;
  const hint = inferHint(res.status, code, message, reason);

  return new InferenceApiError({
    message,
    status: res.status,
    code,
    hint,
    phase,
    details: body.details,
  });
}

export function toInferenceApiError(
  error: unknown
): InferenceApiError | null {
  if (error instanceof InferenceApiError) {
    return error;
  }
  return null;
}

