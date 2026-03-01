import type { TaskType } from "@/types/inference";

export function isFileOutput(value: unknown): value is { url(): URL } {
  return (
    value !== null &&
    typeof value === "object" &&
    "url" in value &&
    typeof (value as Record<string, unknown>).url === "function"
  );
}

export function normalizeOutput(output: unknown): unknown {
  if (isFileOutput(output)) {
    return output.url().href;
  }
  if (Array.isArray(output)) {
    return output.map(normalizeOutput);
  }
  return output;
}

export function extractMediaUrls(output: unknown): string[] {
  const urls: string[] = [];

  function walk(val: unknown) {
    if (typeof val === "string" && val.startsWith("https://")) {
      urls.push(val);
    } else if (Array.isArray(val)) {
      val.forEach(walk);
    }
  }

  walk(output);
  return urls;
}

export function outputTypeForTask(task: TaskType): "text" | "image" | "audio" {
  switch (task) {
    case "text-to-image":
      return "image";
    case "text-to-sound":
      return "audio";
    default:
      return "text";
  }
}
