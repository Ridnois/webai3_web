import { describe, it, expect, vi } from "vitest";
import {
  chainIdToCaip2,
  caip2ToChainId,
  encodePaymentHeader,
  decodePaymentHeader,
  buildPaymentRequiredResponse,
  paymentRequiredResponseSchema,
  paymentPayloadSchema,
  paymentRequirementSchema,
} from "./x402";

vi.mock("@/lib/server-env", () => ({
  getServerEnv: vi.fn(() => ({
    RECEIVER_ADDRESS: "0x" + "ab".repeat(20),
    INFERENCE_RATE_PER_SEC: "0.001",
    X402_FACILITATOR_URL: "https://www.x402.org/facilitator",
  })),
}));

// ─── CAIP-2 mapping ─────────────────────────────────────────────────────────

describe("chainIdToCaip2", () => {
  it("maps Base mainnet", () => {
    expect(chainIdToCaip2(8453)).toBe("eip155:8453");
  });

  it("maps Base Sepolia", () => {
    expect(chainIdToCaip2(84532)).toBe("eip155:84532");
  });

  it("returns undefined for unknown chain", () => {
    expect(chainIdToCaip2(999999)).toBeUndefined();
  });
});

describe("caip2ToChainId", () => {
  it("maps eip155:8453 to Base mainnet", () => {
    expect(caip2ToChainId("eip155:8453")).toBe(8453);
  });

  it("maps eip155:84532 to Base Sepolia", () => {
    expect(caip2ToChainId("eip155:84532")).toBe(84532);
  });

  it("returns undefined for unknown CAIP-2", () => {
    expect(caip2ToChainId("eip155:1")).toBeUndefined();
  });
});

// ─── Header encoding / decoding ─────────────────────────────────────────────

describe("encodePaymentHeader / decodePaymentHeader", () => {
  it("round-trips a payment required response", () => {
    const original = {
      x402Version: 2,
      resource: { url: "/api/inference" },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:84532",
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          amount: "10000",
          payTo: "0x" + "ab".repeat(20),
          maxTimeoutSeconds: 60,
          extra: { name: "USD Coin", version: "2" },
        },
      ],
    };

    const encoded = encodePaymentHeader(original);
    expect(typeof encoded).toBe("string");

    const decoded = decodePaymentHeader(encoded, paymentRequiredResponseSchema);
    expect(decoded).toEqual(original);
  });

  it("throws on invalid base64", () => {
    expect(() =>
      decodePaymentHeader("not-valid-base64!!!", paymentRequirementSchema)
    ).toThrow();
  });
});

// ─── buildPaymentRequiredResponse ───────────────────────────────────────────

describe("buildPaymentRequiredResponse", () => {
  it("builds a valid response for Base Sepolia", () => {
    const result = buildPaymentRequiredResponse(84532, 10000n, "/api/inference");

    expect(result.x402Version).toBe(2);
    expect(result.accepts).toHaveLength(1);

    const req = result.accepts[0];
    expect(req.scheme).toBe("exact");
    expect(req.network).toBe("eip155:84532");
    expect(req.asset).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
    expect(req.amount).toBe("10000");
    expect(req.payTo).toBe("0x" + "ab".repeat(20));
    expect(req.maxTimeoutSeconds).toBe(60);
  });

  it("throws for unsupported chain", () => {
    expect(() => buildPaymentRequiredResponse(999999, 10000n, "/api/inference")).toThrow(
      "Unsupported chain for x402"
    );
  });
});

// ─── Schema validation ──────────────────────────────────────────────────────

describe("paymentPayloadSchema", () => {
  it("accepts a valid v2 payment payload", () => {
    const payload = {
      x402Version: 2,
      accepted: {
        scheme: "exact",
        network: "eip155:84532",
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        amount: "10000",
        payTo: "0x" + "22".repeat(20),
        maxTimeoutSeconds: 60,
        extra: { name: "USD Coin", version: "2" },
      },
      payload: {
        signature: "0x" + "ab".repeat(65),
        authorization: {
          from: "0x" + "11".repeat(20),
          to: "0x" + "22".repeat(20),
          value: "10000",
          validAfter: "0",
          validBefore: String(Math.floor(Date.now() / 1000) + 3600),
          nonce: "0x" + "ff".repeat(32),
        },
      },
    };

    expect(paymentPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects missing accepted field", () => {
    const payload = {
      x402Version: 2,
      payload: {
        signature: "0x" + "ab".repeat(65),
        authorization: {
          from: "0x" + "11".repeat(20),
          to: "0x" + "22".repeat(20),
          value: "10000",
          validAfter: "0",
          validBefore: "999999999",
          nonce: "0x" + "ff".repeat(32),
        },
      },
    };

    expect(paymentPayloadSchema.safeParse(payload).success).toBe(false);
  });
});
