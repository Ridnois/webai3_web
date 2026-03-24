import type { InferenceResponse } from "@/types/inference";
import type { InferenceHistoryItem } from "@/hooks/use-inference-history";
import type { InferenceDetail } from "@/hooks/use-inference-detail";
import type { GalleryItem } from "@/hooks/use-gallery";
import type { OutputType } from "@/types/task-config";
import {
  normalizeTextOutput,
  extractImageUrls,
  extractAudioUrl,
} from "@/lib/output-helpers";

export type OutputStatus = "pending" | "succeeded" | "failed";

export type OutputItem = {
  id: string | null;
  outputType: OutputType;
  status: OutputStatus;

  // Content — exactly one set populated based on outputType
  textContent: string | null;
  mediaUrls: string[];

  // Metadata
  taskType: string | null;
  model: string | null;
  prompt: string | null;
  userAddress: string | null;
  predictTimeMs: number | null;
  costUsdc: number | null;
  errorMessage: string | null;
  isPublic: boolean | null; // null = unknown (e.g. gallery items have no toggle)
  createdAt: string | null;
};

// ── Adapters ──────────────────────────────────────────────────────────────────

export function fromInferenceResponse(
  response: InferenceResponse,
  context: {
    outputType: OutputType;
    taskType?: string;
    model?: string;
    prompt?: string;
  }
): OutputItem {
  const outputType = context.outputType;
  let textContent: string | null = null;
  let mediaUrls: string[] = [];

  if (outputType === "text") {
    textContent = normalizeTextOutput(response.output);
  } else if (outputType === "image") {
    mediaUrls = extractImageUrls(response.output);
  } else if (outputType === "audio") {
    const url = extractAudioUrl(response.output);
    mediaUrls = url ? [url] : [];
  }

  return {
    id: response.id ?? null,
    outputType,
    status: (response.status as OutputStatus) ?? "succeeded",
    textContent,
    mediaUrls,
    taskType: context.taskType ?? null,
    model: context.model ?? null,
    prompt: context.prompt ?? null,
    userAddress: null,
    predictTimeMs: response.metrics?.predictTimeMs ?? null,
    costUsdc: response.metrics?.actualCostUsdc ?? null,
    errorMessage: response.error ?? null,
    isPublic: null,
    createdAt: null,
  };
}

function resolveContent(
  outputType: string,
  outputData: unknown,
  mediaUrls: string[] | null
): { textContent: string | null; resolvedUrls: string[] } {
  if (outputType === "text") {
    return { textContent: normalizeTextOutput(outputData), resolvedUrls: [] };
  }
  if (mediaUrls && mediaUrls.length > 0) {
    return { textContent: null, resolvedUrls: mediaUrls };
  }
  // Fallback: try extracting from outputData
  if (outputType === "image") {
    return { textContent: null, resolvedUrls: extractImageUrls(outputData) };
  }
  if (outputType === "audio") {
    const url = extractAudioUrl(outputData);
    return { textContent: null, resolvedUrls: url ? [url] : [] };
  }
  return { textContent: null, resolvedUrls: [] };
}

export function fromHistoryItem(item: InferenceHistoryItem): OutputItem {
  const { textContent, resolvedUrls } = resolveContent(
    item.outputType,
    item.outputData,
    item.mediaUrls
  );

  return {
    id: item.id,
    outputType: item.outputType as OutputType,
    status: (item.status as OutputStatus) ?? "succeeded",
    textContent,
    mediaUrls: resolvedUrls,
    taskType: item.taskType,
    model: item.model,
    prompt:
      typeof item.input?.prompt === "string" ? item.input.prompt : null,
    userAddress: null,
    predictTimeMs: item.predictTimeMs,
    costUsdc: null,
    errorMessage: null,
    isPublic: item.isPublic === 1,
    createdAt: item.createdAt,
  };
}

export function fromGalleryItem(item: GalleryItem): OutputItem {
  const { textContent, resolvedUrls } = resolveContent(
    item.outputType,
    item.outputData,
    item.mediaUrls
  );

  return {
    id: item.id,
    outputType: item.outputType as OutputType,
    status: "succeeded",
    textContent,
    mediaUrls: resolvedUrls,
    taskType: item.taskType,
    model: item.model,
    prompt:
      typeof item.input?.prompt === "string" ? item.input.prompt : null,
    userAddress: item.userAddress,
    predictTimeMs: item.predictTimeMs,
    costUsdc: null,
    errorMessage: null,
    isPublic: true,
    createdAt: item.createdAt,
  };
}

export function fromInferenceDetail(item: InferenceDetail): OutputItem {
  const { textContent, resolvedUrls } = resolveContent(
    item.outputType,
    item.outputData,
    item.mediaUrls
  );

  return {
    id: item.id,
    outputType: item.outputType as OutputType,
    status: (item.status as OutputStatus) ?? "succeeded",
    textContent,
    mediaUrls: resolvedUrls,
    taskType: item.taskType,
    model: item.model,
    prompt:
      typeof item.input?.prompt === "string" ? item.input.prompt : null,
    userAddress: item.userAddress,
    predictTimeMs: item.predictTimeMs,
    costUsdc: null,
    errorMessage: item.errorMessage ?? null,
    isPublic: item.isPublic === 1,
    createdAt: item.createdAt,
  };
}
