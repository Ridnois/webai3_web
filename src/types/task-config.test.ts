import { describe, it, expect } from "vitest";
import { TASK_CONFIGS } from "./task-config";
import type { TaskType } from "./inference";

const TASK_TYPES: TaskType[] = ["text-to-image", "text-to-text", "text-to-sound"];

describe("TASK_CONFIGS", () => {
  it("defines a config for every task type", () => {
    for (const task of TASK_TYPES) {
      expect(TASK_CONFIGS[task]).toBeDefined();
    }
  });

  describe.each(TASK_TYPES)("%s config", (task) => {
    const config = TASK_CONFIGS[task];

    it("has a non-empty label", () => {
      expect(config.label.length).toBeGreaterThan(0);
    });

    it("has a non-empty description", () => {
      expect(config.description.length).toBeGreaterThan(0);
    });

    it("has a non-empty icon name", () => {
      expect(config.icon.length).toBeGreaterThan(0);
    });

    it("task field matches its key", () => {
      expect(config.task).toBe(task);
    });

    it("has at least one input field", () => {
      expect(config.fields.length).toBeGreaterThan(0);
    });

    it("includes a required prompt field", () => {
      const prompt = config.fields.find((f) => f.name === "prompt");
      expect(prompt).toBeDefined();
      expect(prompt?.required).toBe(true);
    });

    it("every field has a name and label", () => {
      for (const field of config.fields) {
        expect(field.name.length).toBeGreaterThan(0);
        expect(field.label.length).toBeGreaterThan(0);
      }
    });

    it("number fields have valid min/max bounds", () => {
      const numberFields = config.fields.filter((f) => f.type === "number");
      for (const field of numberFields) {
        if (field.min !== undefined && field.max !== undefined) {
          expect(field.min).toBeLessThan(field.max);
        }
      }
    });
  });

  describe("output types", () => {
    it("text-to-image outputs image", () => {
      expect(TASK_CONFIGS["text-to-image"].outputType).toBe("image");
    });

    it("text-to-text outputs text", () => {
      expect(TASK_CONFIGS["text-to-text"].outputType).toBe("text");
    });

    it("text-to-sound outputs audio", () => {
      expect(TASK_CONFIGS["text-to-sound"].outputType).toBe("audio");
    });
  });

  describe("text-to-image specific fields", () => {
    const config = TASK_CONFIGS["text-to-image"];

    it("has a num_outputs number field", () => {
      const field = config.fields.find((f) => f.name === "num_outputs");
      expect(field).toBeDefined();
      expect(field?.type).toBe("number");
    });

    it("num_outputs allows between 1 and 4", () => {
      const field = config.fields.find((f) => f.name === "num_outputs");
      expect(field?.min).toBe(1);
      expect(field?.max).toBe(4);
    });
  });

  describe("text-to-text specific fields", () => {
    it("has a max_tokens number field", () => {
      const field = TASK_CONFIGS["text-to-text"].fields.find(
        (f) => f.name === "max_tokens"
      );
      expect(field).toBeDefined();
      expect(field?.type).toBe("number");
    });
  });

  describe("text-to-sound specific fields", () => {
    it("has a duration number field", () => {
      const field = TASK_CONFIGS["text-to-sound"].fields.find(
        (f) => f.name === "duration"
      );
      expect(field).toBeDefined();
      expect(field?.type).toBe("number");
    });
  });
});
