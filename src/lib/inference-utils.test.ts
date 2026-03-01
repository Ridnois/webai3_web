import { describe, it, expect } from "vitest";
import {
  isFileOutput,
  normalizeOutput,
  extractMediaUrls,
  outputTypeForTask,
} from "./inference-utils";

// ─── isFileOutput ─────────────────────────────────────────────────────────────

describe("isFileOutput", () => {
  it("returns true for an object with a url() function", () => {
    expect(isFileOutput({ url: () => new URL("https://example.com") })).toBe(true);
  });

  it("returns false for an object without a url property", () => {
    expect(isFileOutput({ href: "https://example.com" })).toBe(false);
  });

  it("returns false when url is a string, not a function", () => {
    expect(isFileOutput({ url: "https://example.com" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isFileOutput(null)).toBe(false);
  });

  it("returns false for a plain string", () => {
    expect(isFileOutput("https://example.com")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isFileOutput(42)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isFileOutput([])).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isFileOutput(undefined)).toBe(false);
  });
});

// ─── normalizeOutput ──────────────────────────────────────────────────────────

describe("normalizeOutput", () => {
  it("converts a FileOutput object to its URL string", () => {
    const fileOutput = { url: () => new URL("https://replicate.delivery/image.png") };
    expect(normalizeOutput(fileOutput)).toBe("https://replicate.delivery/image.png");
  });

  it("normalizes an array of FileOutput objects", () => {
    const outputs = [
      { url: () => new URL("https://example.com/a.png") },
      { url: () => new URL("https://example.com/b.png") },
    ];
    expect(normalizeOutput(outputs)).toEqual([
      "https://example.com/a.png",
      "https://example.com/b.png",
    ]);
  });

  it("passes through a plain string", () => {
    expect(normalizeOutput("hello world")).toBe("hello world");
  });

  it("passes through a plain string URL unchanged", () => {
    const url = "https://example.com/image.png";
    expect(normalizeOutput(url)).toBe(url);
  });

  it("passes through an array of plain strings", () => {
    const output = ["https://a.com/1.png", "https://b.com/2.png"];
    expect(normalizeOutput(output)).toEqual(output);
  });

  it("normalizes a mixed array of FileOutput and strings", () => {
    const input = [
      { url: () => new URL("https://example.com/a.png") },
      "https://example.com/b.png",
    ];
    expect(normalizeOutput(input)).toEqual([
      "https://example.com/a.png",
      "https://example.com/b.png",
    ]);
  });

  it("passes through null", () => {
    expect(normalizeOutput(null)).toBeNull();
  });

  it("passes through a number", () => {
    expect(normalizeOutput(42)).toBe(42);
  });

  it("passes through an empty array", () => {
    expect(normalizeOutput([])).toEqual([]);
  });
});

// ─── extractMediaUrls ─────────────────────────────────────────────────────────

describe("extractMediaUrls", () => {
  it("extracts a single https URL from a string", () => {
    expect(extractMediaUrls("https://example.com/image.png")).toEqual([
      "https://example.com/image.png",
    ]);
  });

  it("extracts multiple https URLs from an array", () => {
    const output = [
      "https://example.com/1.png",
      "https://example.com/2.png",
    ];
    expect(extractMediaUrls(output)).toEqual(output);
  });

  it("returns an empty array for a plain text string", () => {
    expect(extractMediaUrls("just some text output")).toEqual([]);
  });

  it("ignores http:// URLs (non-https)", () => {
    expect(extractMediaUrls("http://example.com/image.png")).toEqual([]);
  });

  it("returns an empty array for null", () => {
    expect(extractMediaUrls(null)).toEqual([]);
  });

  it("returns an empty array for a number", () => {
    expect(extractMediaUrls(42)).toEqual([]);
  });

  it("returns an empty array for an empty array", () => {
    expect(extractMediaUrls([])).toEqual([]);
  });

  it("handles nested arrays", () => {
    const output = [["https://example.com/a.png"], ["https://example.com/b.png"]];
    expect(extractMediaUrls(output)).toEqual([
      "https://example.com/a.png",
      "https://example.com/b.png",
    ]);
  });

  it("skips non-string elements in an array", () => {
    const output = ["https://example.com/img.png", 42, null, true];
    expect(extractMediaUrls(output)).toEqual(["https://example.com/img.png"]);
  });
});

// ─── outputTypeForTask ────────────────────────────────────────────────────────

describe("outputTypeForTask", () => {
  it("returns 'image' for text-to-image", () => {
    expect(outputTypeForTask("text-to-image")).toBe("image");
  });

  it("returns 'audio' for text-to-sound", () => {
    expect(outputTypeForTask("text-to-sound")).toBe("audio");
  });

  it("returns 'text' for text-to-text", () => {
    expect(outputTypeForTask("text-to-text")).toBe("text");
  });
});
