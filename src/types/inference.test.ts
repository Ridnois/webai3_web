import { describe, it, expect } from "vitest";
import {
  taskTypeSchema,
  replicateModelSchema,
  inferenceRequestSchema,
  inferenceResponseSchema,
} from "./inference";

// ─── taskTypeSchema ───────────────────────────────────────────────────────────

describe("taskTypeSchema", () => {
  it.each(["text-to-image", "text-to-text", "text-to-sound"])(
    "accepts '%s'",
    (value) => {
      expect(taskTypeSchema.safeParse(value).success).toBe(true);
    }
  );

  it.each(["image", "text", "video", "", 42, null, undefined])(
    "rejects %j",
    (value) => {
      expect(taskTypeSchema.safeParse(value).success).toBe(false);
    }
  );
});

// ─── replicateModelSchema ─────────────────────────────────────────────────────

describe("replicateModelSchema", () => {
  const validModel = {
    owner: "stability-ai",
    name: "stable-diffusion",
    description: "A latent text-to-image diffusion model",
    coverImageUrl: "https://example.com/cover.jpg",
    runCount: 1_000_000,
    url: "https://replicate.com/stability-ai/stable-diffusion",
  };

  it("accepts a fully populated model", () => {
    expect(replicateModelSchema.safeParse(validModel).success).toBe(true);
  });

  it("accepts null description", () => {
    const result = replicateModelSchema.safeParse({
      ...validModel,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null coverImageUrl", () => {
    const result = replicateModelSchema.safeParse({
      ...validModel,
      coverImageUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing owner", () => {
    const { owner: _owner, ...rest } = validModel;
    expect(replicateModelSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name: _name, ...rest } = validModel;
    expect(replicateModelSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing url", () => {
    const { url: _url, ...rest } = validModel;
    expect(replicateModelSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects non-number runCount", () => {
    expect(
      replicateModelSchema.safeParse({ ...validModel, runCount: "1000" }).success
    ).toBe(false);
  });
});

// ─── inferenceRequestSchema ───────────────────────────────────────────────────

describe("inferenceRequestSchema", () => {
  const validRequest = {
    model: "owner/model-name",
    task: "text-to-image",
    input: { prompt: "a red cat" },
  };

  it("accepts a valid request", () => {
    expect(inferenceRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("accepts an empty input object", () => {
    const result = inferenceRequestSchema.safeParse({
      ...validRequest,
      input: {},
    });
    expect(result.success).toBe(true);
  });

  it("accepts input with mixed value types", () => {
    const result = inferenceRequestSchema.safeParse({
      ...validRequest,
      input: { prompt: "hello", num_outputs: 2, enable_hdr: true },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing model", () => {
    const { model: _model, ...rest } = validRequest;
    expect(inferenceRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty model string", () => {
    expect(
      inferenceRequestSchema.safeParse({ ...validRequest, model: "" }).success
    ).toBe(false);
  });

  it("rejects an invalid task value", () => {
    expect(
      inferenceRequestSchema.safeParse({ ...validRequest, task: "text-to-video" }).success
    ).toBe(false);
  });

  it("rejects a missing task", () => {
    const { task: _task, ...rest } = validRequest;
    expect(inferenceRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a missing input", () => {
    const { input: _input, ...rest } = validRequest;
    expect(inferenceRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects input that is not an object", () => {
    expect(
      inferenceRequestSchema.safeParse({ ...validRequest, input: "prompt" }).success
    ).toBe(false);
  });
});

// ─── inferenceResponseSchema ──────────────────────────────────────────────────

describe("inferenceResponseSchema", () => {
  it("accepts a successful response with all fields", () => {
    const result = inferenceResponseSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      output: "https://example.com/image.png",
      status: "succeeded",
      metrics: { predictTimeMs: 4200 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal response with only required fields", () => {
    const result = inferenceResponseSchema.safeParse({
      output: "some text",
      status: "succeeded",
    });
    expect(result.success).toBe(true);
  });

  it("accepts output as an array", () => {
    const result = inferenceResponseSchema.safeParse({
      output: ["https://example.com/1.png", "https://example.com/2.png"],
      status: "succeeded",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a failed response with error field", () => {
    const result = inferenceResponseSchema.safeParse({
      output: null,
      status: "failed",
      error: "Model timed out",
    });
    expect(result.success).toBe(true);
  });

  it("accepts metrics without predictTimeMs", () => {
    const result = inferenceResponseSchema.safeParse({
      output: "text",
      status: "succeeded",
      metrics: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing status", () => {
    const result = inferenceResponseSchema.safeParse({
      output: "text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid uuid in id field", () => {
    const result = inferenceResponseSchema.safeParse({
      id: "not-a-uuid",
      output: "text",
      status: "succeeded",
    });
    expect(result.success).toBe(false);
  });
});
