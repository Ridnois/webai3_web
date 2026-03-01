import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import { taskTypeSchema } from "@/types/inference";
import {
  getModelDiscoveryConfig,
  getCuratedFallbackModels,
} from "@/lib/model-discovery";

interface ReplicateCollectionModel {
  owner: string;
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  run_count: number;
  url: string;
}

function isMissingCollectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("404") || msg.includes("no collection matches");
}

function normalizeModels(models: ReplicateCollectionModel[]) {
  const seen = new Set<string>();
  return models
    .sort((a, b) => b.run_count - a.run_count)
    .filter((m) => {
      const key = `${m.owner}/${m.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20)
    .map((m) => ({
      owner: m.owner,
      name: m.name,
      description: m.description ?? null,
      coverImageUrl: m.cover_image_url ?? null,
      runCount: m.run_count,
      url: m.url,
    }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const taskParam = searchParams.get("task");

  const parsed = taskTypeSchema.safeParse(taskParam);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid task type", code: "INVALID_TASK" },
      { status: 400 }
    );
  }

  const task = parsed.data;
  const discoveryConfig = getModelDiscoveryConfig(task);

  try {
    const replicate = getReplicateClient();
    const collectedModels: ReplicateCollectionModel[] = [];
    const errors: string[] = [];

    for (const slug of discoveryConfig.collectionSlugs) {
      try {
        const collection = await replicate.collections.get(slug);
        const models = (collection.models ?? []) as ReplicateCollectionModel[];
        collectedModels.push(...models);
      } catch (err) {
        if (isMissingCollectionError(err)) {
          continue;
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`[${slug}] ${message}`);
      }
    }

    if (collectedModels.length > 0) {
      return NextResponse.json(normalizeModels(collectedModels));
    }

    const fallbackModels = getCuratedFallbackModels(task);
    if (fallbackModels.length > 0) {
      return NextResponse.json(fallbackModels);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(" | "), code: "REPLICATE_ERROR" },
        { status: 502 }
      );
    }

    return NextResponse.json([]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, code: "REPLICATE_ERROR" },
      { status: 502 }
    );
  }
}
