import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ─── Hoist mock handles so they're accessible inside vi.mock() factories ──────

const {
  mockRequireAuth,
  mockGetSession,
  mockRun,
  mockReturning,
  mockUploadMediaToR2,
  mockGetPresignedUrls,
  mockVerifyWithFacilitator,
  mockSettleWithFacilitator,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGetSession: vi.fn(),
  mockRun: vi.fn(),
  mockReturning: vi.fn(),
  mockUploadMediaToR2: vi.fn(),
  mockGetPresignedUrls: vi.fn(),
  mockVerifyWithFacilitator: vi.fn(),
  mockSettleWithFacilitator: vi.fn(),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ requireAuth: mockRequireAuth }));

vi.mock("@/lib/session", () => ({ getSession: mockGetSession }));

vi.mock("@/lib/replicate", () => ({
  getReplicateClient: vi.fn(() => ({ run: mockRun })),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: mockReturning })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    })),
  })),
}));

vi.mock("@/lib/r2", () => ({
  uploadMediaToR2: mockUploadMediaToR2,
  getPresignedUrls: mockGetPresignedUrls,
}));

vi.mock("@/lib/server-env", () => ({
  getServerEnv: vi.fn(() => ({
    RECEIVER_ADDRESS: "0x" + "ab".repeat(20),
    INFERENCE_RATE_PER_SEC: "0.001",
    X402_FACILITATOR_URL: "https://www.x402.org/facilitator",
  })),
}));

vi.mock("@/lib/x402", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/x402")>();
  return {
    ...actual,
    verifyWithFacilitator: mockVerifyWithFacilitator,
    settleWithFacilitator: mockSettleWithFacilitator,
  };
});

vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUTHED = { address: "0xdeadbeef" };
const SESSION = { address: "0xdeadbeef", chainId: 84532 };

const VALID_BODY = {
  model: "owner/text-model",
  task: "text-to-text",
  input: { prompt: "Summarize quantum computing" },
};

const VALID_IMAGE_BODY = {
  model: "owner/image-model",
  task: "text-to-image",
  input: { prompt: "A red cat" },
};

// Build a valid Payment-Signature header
const VALID_PAYMENT_PAYLOAD = {
  x402Version: 2,
  payload: {
    signature: "0x" + "ab".repeat(65),
    authorization: {
      from: "0xdeadbeef",
      to: "0x" + "ab".repeat(20),
      value: "10000",
      validAfter: "0",
      validBefore: String(Math.floor(Date.now() / 1000) + 3600),
      nonce: "0x" + "ff".repeat(32),
    },
  },
};
const VALID_PAYMENT_SIGNATURE_HEADER = btoa(JSON.stringify(VALID_PAYMENT_PAYLOAD));

function makeRequest(body: unknown, paymentSignature?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (paymentSignature) {
    headers["Payment-Signature"] = paymentSignature;
  }
  return new NextRequest("http://localhost/api/inference", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

import { POST } from "./route";

describe("POST /api/inference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(SESSION);
    mockVerifyWithFacilitator.mockResolvedValue({ isValid: true, payer: "0xdeadbeef" });
    mockSettleWithFacilitator.mockResolvedValue({
      success: true,
      transaction: "0x" + "cc".repeat(32),
      network: "eip155:84532",
      payer: "0xdeadbeef",
    });
  });

  // ── Authentication ──────────────────────────────────────────────────────────

  describe("authentication", () => {
    it("returns 401 when the user is not authenticated", async () => {
      mockRequireAuth.mockResolvedValue(
        NextResponse.json(
          { error: "Authentication required", code: "UNAUTHORIZED" },
          { status: 401 }
        )
      );

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.code).toBe("UNAUTHORIZED");
    });
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  describe("request validation", () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(AUTHED);
    });

    it("returns 400 when model is missing", async () => {
      const { model: _m, ...rest } = VALID_BODY;
      const res = await POST(makeRequest(rest));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when model is an empty string", async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, model: "" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when task is invalid", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, task: "text-to-video" })
      );
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when input is missing", async () => {
      const { input: _i, ...rest } = VALID_BODY;
      const res = await POST(makeRequest(rest));
      expect(res.status).toBe(400);
    });

    it("returns 400 on malformed JSON body", async () => {
      const req = new NextRequest("http://localhost/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ not valid json",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe("INVALID_BODY");
    });
  });

  // ── Phase 1: 402 Payment Required ──────────────────────────────────────────

  describe("Phase 1 — no Payment-Signature header", () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(AUTHED);
    });

    it("returns 402 with Payment-Required header", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(402);

      const paymentRequired = res.headers.get("Payment-Required");
      expect(paymentRequired).toBeTruthy();

      // Decode and check structure
      const decoded = JSON.parse(atob(paymentRequired!));
      expect(decoded.x402Version).toBe(2);
      expect(decoded.paymentRequirements).toHaveLength(1);
      expect(decoded.paymentRequirements[0].network).toBe("eip155:84532");
    });

    it("includes Access-Control-Expose-Headers", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      const expose = res.headers.get("Access-Control-Expose-Headers");
      expect(expose).toContain("Payment-Required");
      expect(expose).toContain("Payment-Response");
    });

    it("includes estimatedCostUsdc in body", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      const body = await res.json();
      expect(body.estimatedCostUsdc).toBeTypeOf("number");
      expect(body.code).toBe("PAYMENT_REQUIRED");
    });
  });

  // ── Phase 2: verify → settle → run → 200 ──────────────────────────────────

  describe("Phase 2 — with Payment-Signature header", () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(AUTHED);
      mockRun.mockResolvedValue("The quick brown fox.");
      mockReturning.mockResolvedValue([{ id: "text-inference-id" }]);
    });

    it("returns 200 with text output after verify + settle", async () => {
      const res = await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.id).toBe("text-inference-id");
      expect(body.output).toBe("The quick brown fox.");
      expect(body.status).toBe("succeeded");
    });

    it("includes Payment-Response header on success", async () => {
      const res = await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      const paymentResponse = res.headers.get("Payment-Response");
      expect(paymentResponse).toBeTruthy();

      const decoded = JSON.parse(atob(paymentResponse!));
      expect(decoded.success).toBe(true);
      expect(decoded.transaction).toBeTruthy();
    });

    it("includes predictTimeMs in metrics", async () => {
      const res = await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      const body = await res.json();
      expect(typeof body.metrics.predictTimeMs).toBe("number");
      expect(body.metrics.predictTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("returns 402 when facilitator verification fails", async () => {
      mockVerifyWithFacilitator.mockResolvedValue({
        isValid: false,
        invalidReason: "Insufficient allowance",
      });

      const res = await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      expect(res.status).toBe(402);

      const body = await res.json();
      expect(body.code).toBe("PAYMENT_INVALID");
      expect(body.error).toContain("Insufficient allowance");
    });

    it("returns 400 for invalid Payment-Signature header", async () => {
      const res = await POST(makeRequest(VALID_BODY, "not-valid-base64!!!"));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe("PAYMENT_INVALID");
    });

    it("returns 402 when settlement fails and does not run inference", async () => {
      mockSettleWithFacilitator.mockRejectedValue(
        new Error("Facilitator /settle failed (500): internal error")
      );

      const res = await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      expect(res.status).toBe(402);

      const body = await res.json();
      expect(body.code).toBe("SETTLEMENT_FAILED");
      expect(body.error).toContain("Facilitator /settle failed");

      // Inference should never have been called
      expect(mockRun).not.toHaveBeenCalled();
    });
  });

  // ── Image inference (Phase 2) ─────────────────────────────────────────────

  describe("text-to-image inference (Phase 2)", () => {
    const IMAGE_URL = "https://replicate.delivery/pbxt/image.png";
    const PRESIGNED_URL = "https://r2.example.com/presigned/image.png";

    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(AUTHED);
      mockRun.mockResolvedValue([IMAGE_URL]);
      mockReturning.mockResolvedValue([{ id: "image-inference-id" }]);
      mockUploadMediaToR2.mockResolvedValue(
        "0xdeadbeef/image-inference-id/0.png"
      );
      mockGetPresignedUrls.mockResolvedValue([PRESIGNED_URL]);
    });

    it("returns 200 with the presigned URL", async () => {
      const res = await POST(makeRequest(VALID_IMAGE_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.id).toBe("image-inference-id");
      expect(body.output).toBe(PRESIGNED_URL);
      expect(body.status).toBe("succeeded");
    });

    it("uploads media to R2 with the correct arguments", async () => {
      await POST(makeRequest(VALID_IMAGE_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      expect(mockUploadMediaToR2).toHaveBeenCalledWith(
        IMAGE_URL,
        AUTHED.address,
        "image-inference-id",
        0
      );
    });

    it("does not call R2 upload for text output", async () => {
      mockRun.mockResolvedValue("The quick brown fox.");
      mockReturning.mockResolvedValue([{ id: "text-inference-id" }]);
      await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      expect(mockUploadMediaToR2).not.toHaveBeenCalled();
    });
  });

  // ── Replicate errors ────────────────────────────────────────────────────────

  describe("Replicate errors (Phase 2)", () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(AUTHED);
      mockRun.mockRejectedValue(new Error("Model prediction failed"));
    });

    it("returns 502 when Replicate throws", async () => {
      const res = await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      expect(res.status).toBe(502);
    });

    it("returns the error message and INFERENCE_ERROR code", async () => {
      const res = await POST(makeRequest(VALID_BODY, VALID_PAYMENT_SIGNATURE_HEADER));
      const body = await res.json();
      expect(body.error).toBe("Model prediction failed");
      expect(body.code).toBe("INFERENCE_ERROR");
    });
  });
});
