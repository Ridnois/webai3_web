import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockCollectionsGet } = vi.hoisted(() => ({
  mockCollectionsGet: vi.fn(),
}));

vi.mock("@/lib/replicate", () => ({
  getReplicateClient: vi.fn(() => ({
    collections: { get: mockCollectionsGet },
  })),
}));

import { GET } from "./route";

describe("GET /api/models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid task", async () => {
    const req = new NextRequest("http://localhost/api/models?task=bad-task");
    const res = await GET(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: "INVALID_TASK",
    });
  });

  it("falls back to curated models when collections are missing", async () => {
    mockCollectionsGet.mockRejectedValue(
      new Error(
        'Request to https://api.replicate.com/v1/collections/text-to-audio failed with status 404 Not Found: {"detail":"No Collection matches the given query."}'
      )
    );

    const req = new NextRequest(
      "http://localhost/api/models?task=text-to-sound"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ owner: string; name: string }>;
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].owner.length).toBeGreaterThan(0);
    expect(body[0].name.length).toBeGreaterThan(0);
  });

  it("returns collection models sorted by run count when available", async () => {
    mockCollectionsGet
      .mockRejectedValueOnce(new Error("404 No Collection matches"))
      .mockResolvedValueOnce({
        models: [
          {
            owner: "acme",
            name: "model-a",
            description: "A",
            cover_image_url: null,
            run_count: 12,
            url: "https://replicate.com/acme/model-a",
          },
          {
            owner: "acme",
            name: "model-b",
            description: "B",
            cover_image_url: null,
            run_count: 100,
            url: "https://replicate.com/acme/model-b",
          },
        ],
      });

    const req = new NextRequest("http://localhost/api/models?task=text-to-text");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body[0].name).toBe("model-b");
    expect(body[1].name).toBe("model-a");
  });
});

