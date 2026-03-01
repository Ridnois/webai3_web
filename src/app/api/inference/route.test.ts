import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ─── Hoist mock handles so they're accessible inside vi.mock() factories ──────

const {
  mockRequireAuth,
  mockRun,
  mockReturning,
  mockUploadMediaToR2,
  mockGetPresignedUrls,
  mockVerifyPayment,
  mockSelectWhere,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRun: vi.fn(),
  mockReturning: vi.fn(),
  mockUploadMediaToR2: vi.fn(),
  mockGetPresignedUrls: vi.fn(),
  mockVerifyPayment: vi.fn(),
  mockSelectWhere: vi.fn(),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ requireAuth: mockRequireAuth }));

vi.mock("@/lib/replicate", () => ({
  getReplicateClient: vi.fn(() => ({ run: mockRun })),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: mockSelectWhere,
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
  })),
}));

vi.mock("@/lib/verify-payment", () => ({
  verifyPayment: mockVerifyPayment,
}));

vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/inference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const AUTHED = { address: "0xdeadbeef" };

const VALID_PAYMENT = {
  txHash: "0x" + "ab".repeat(32),
  chainId: 84532,
  estimatedCostUsdc: 0.01,
};

const VALID_TEXT_BODY = {
  model: "owner/text-model",
  task: "text-to-text",
  input: { prompt: "Summarize quantum computing" },
  payment: VALID_PAYMENT,
};

const VALID_IMAGE_BODY = {
  model: "owner/image-model",
  task: "text-to-image",
  input: { prompt: "A red cat" },
  payment: VALID_PAYMENT,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

import { POST } from "./route";

describe("POST /api/inference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: payment verifies OK and no duplicate txHash
    mockVerifyPayment.mockResolvedValue({ valid: true, actualAmount: 10000n });
    mockSelectWhere.mockResolvedValue([]);
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

      const res = await POST(makeRequest(VALID_TEXT_BODY));
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
      const { model: _m, ...rest } = VALID_TEXT_BODY;
      const res = await POST(makeRequest(rest));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when model is an empty string", async () => {
      const res = await POST(makeRequest({ ...VALID_TEXT_BODY, model: "" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when task is invalid", async () => {
      const res = await POST(
        makeRequest({ ...VALID_TEXT_BODY, task: "text-to-video" })
      );
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when input is missing", async () => {
      const { input: _i, ...rest } = VALID_TEXT_BODY;
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

  // ── Text inference ──────────────────────────────────────────────────────────

  describe("text-to-text inference", () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(AUTHED);
      mockRun.mockResolvedValue("The quick brown fox.");
      mockReturning.mockResolvedValue([{ id: "text-inference-id" }]);
    });

    it("returns 200 with the text output and inference id", async () => {
      const res = await POST(makeRequest(VALID_TEXT_BODY));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.id).toBe("text-inference-id");
      expect(body.output).toBe("The quick brown fox.");
      expect(body.status).toBe("succeeded");
    });

    it("includes predictTimeMs in metrics", async () => {
      const res = await POST(makeRequest(VALID_TEXT_BODY));
      const body = await res.json();
      expect(typeof body.metrics.predictTimeMs).toBe("number");
      expect(body.metrics.predictTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("does not call R2 upload for text output", async () => {
      await POST(makeRequest(VALID_TEXT_BODY));
      expect(mockUploadMediaToR2).not.toHaveBeenCalled();
    });
  });

  // ── Image inference ─────────────────────────────────────────────────────────

  describe("text-to-image inference", () => {
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
      const res = await POST(makeRequest(VALID_IMAGE_BODY));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.id).toBe("image-inference-id");
      expect(body.output).toBe(PRESIGNED_URL);
      expect(body.status).toBe("succeeded");
    });

    it("uploads media to R2 with the correct arguments", async () => {
      await POST(makeRequest(VALID_IMAGE_BODY));
      expect(mockUploadMediaToR2).toHaveBeenCalledWith(
        IMAGE_URL,
        AUTHED.address,
        "image-inference-id",
        0
      );
    });

    it("calls getPresignedUrls with the R2 key returned by upload", async () => {
      await POST(makeRequest(VALID_IMAGE_BODY));
      expect(mockGetPresignedUrls).toHaveBeenCalledWith([
        "0xdeadbeef/image-inference-id/0.png",
      ]);
    });
  });

  // ── Replicate errors ────────────────────────────────────────────────────────

  describe("Replicate errors", () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue(AUTHED);
      mockRun.mockRejectedValue(new Error("Model prediction failed"));
      // failure path inserts without .returning(), so mockReturning won't be called
    });

    it("returns 502 when Replicate throws", async () => {
      const res = await POST(makeRequest(VALID_TEXT_BODY));
      expect(res.status).toBe(502);
    });

    it("returns the error message and INFERENCE_ERROR code", async () => {
      const res = await POST(makeRequest(VALID_TEXT_BODY));
      const body = await res.json();
      expect(body.error).toBe("Model prediction failed");
      expect(body.code).toBe("INFERENCE_ERROR");
    });
  });
});
