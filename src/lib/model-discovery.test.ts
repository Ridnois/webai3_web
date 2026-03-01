import { describe, it, expect } from "vitest";
import { getModelDiscoveryConfig, getCuratedFallbackModels } from "./model-discovery";

describe("model discovery config", () => {
  it("defines multiple collection slugs for text-to-sound", () => {
    const config = getModelDiscoveryConfig("text-to-sound");
    expect(config.collectionSlugs.length).toBeGreaterThan(1);
  });

  it("provides curated fallback models for each task", () => {
    const tasks = ["text-to-image", "text-to-text", "text-to-sound"] as const;
    for (const task of tasks) {
      const fallback = getCuratedFallbackModels(task);
      expect(fallback.length).toBeGreaterThan(0);
      for (const model of fallback) {
        expect(model.owner.length).toBeGreaterThan(0);
        expect(model.name.length).toBeGreaterThan(0);
        expect(model.url.startsWith("https://replicate.com/")).toBe(true);
      }
    }
  });
});

