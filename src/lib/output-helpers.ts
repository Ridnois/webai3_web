/**
 * Shared output extraction helpers.
 * Used by raw renderers (TextResult, ImageResult, AudioResult) and OutputItem adapters.
 */

export function normalizeTextOutput(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.join("");
  return JSON.stringify(output, null, 2);
}

export function extractImageUrls(output: unknown): string[] {
  if (typeof output === "string") return [output];
  if (Array.isArray(output)) {
    return output.filter((item): item is string => typeof item === "string");
  }
  if (
    output &&
    typeof output === "object" &&
    "url" in output &&
    typeof (output as Record<string, unknown>).url === "string"
  ) {
    return [(output as Record<string, unknown>).url as string];
  }
  return [];
}

export function extractAudioUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (
    output &&
    typeof output === "object" &&
    "audio_out" in output &&
    typeof (output as Record<string, unknown>).audio_out === "string"
  ) {
    return (output as Record<string, unknown>).audio_out as string;
  }
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
    return output[0];
  }
  return null;
}
