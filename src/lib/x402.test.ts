import { describe, it, expect, vi } from "vitest";
import {
  chainIdToCaip2,
  caip2ToChainId,
  encodePaymentHeader,
  decodePaymentHeader,
  buildPaymentRequirementsResponse,
  paymentRequirementsResponseSchema,
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
  it("round-trips a payment requirements response", () => {
    const original = {
      x402Version: 2,
      paymentRequirements: [
        {
          network: "eip155:84532",
          tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          tokenDecimals: 6,
          receiverAddress: "0x" + "ab".repeat(20),
          amountRequired: "10000",
          resource: "/api/inference",
        },
      ],
    };

    const encoded = encodePaymentHeader(original);
    expect(typeof encoded).toBe("string");

    const decoded = decodePaymentHeader(encoded, paymentRequirementsResponseSchema);
    expect(decoded).toEqual(original);
  });

  it("throws on invalid base64", () => {
    expect(() =>
      decodePaymentHeader("not-valid-base64!!!", paymentRequirementSchema)
    ).toThrow();
  });
});

// ─── buildPaymentRequirementsResponse ───────────────────────────────────────

describe("buildPaymentRequirementsResponse", () => {
  it("builds a valid response for Base Sepolia", () => {
    const result = buildPaymentRequirementsResponse(84532, 10000n, "/api/inference");

    expect(result.x402Version).toBe(2);
    expect(result.paymentRequirements).toHaveLength(1);

    const req = result.paymentRequirements[0];
    expect(req.network).toBe("eip155:84532");
    expect(req.tokenAddress).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
    expect(req.tokenDecimals).toBe(6);
    expect(req.amountRequired).toBe("10000");
    expect(req.resource).toBe("/api/inference");
  });

  it("throws for unsupported chain", () => {
    expect(() => buildPaymentRequirementsResponse(999999, 10000n, "/api/inference")).toThrow(
      "Unsupported chain for x402"
    );
  });
});

// ─── Schema validation ──────────────────────────────────────────────────────

describe("paymentPayloadSchema", () => {
  it("accepts a valid payment payload", () => {
    const payload = {
      x402Version: 2,
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

  it("rejects missing signature", () => {
    const payload = {
      x402Version: 2,
      payload: {
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
