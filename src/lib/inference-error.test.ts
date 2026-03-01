import { describe, it, expect } from "vitest";
import { InferenceApiError, parseInferenceApiError } from "./inference-error";

describe("parseInferenceApiError", () => {
  it("maps payment invalid errors with actionable hint", async () => {
    const res = new Response(
      JSON.stringify({
        error: "Payment verification failed: Insufficient allowance",
        code: "PAYMENT_INVALID",
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );

    const err = await parseInferenceApiError(res, "Inference failed", "submit");

    expect(err).toBeInstanceOf(InferenceApiError);
    expect(err.code).toBe("PAYMENT_INVALID");
    expect(err.status).toBe(402);
    expect(err.hint).toContain("Insufficient funds");
  });

  it("maps auth errors with re-signin hint", async () => {
    const res = new Response(
      JSON.stringify({ error: "Authentication required", code: "UNAUTHORIZED" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );

    const err = await parseInferenceApiError(res, "Request failed", "request");

    expect(err.status).toBe(401);
    expect(err.hint).toContain("Sign in again");
  });
});

