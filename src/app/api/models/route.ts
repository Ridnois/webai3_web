import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import { taskTypeSchema } from "@/types/inference";
import { TASK_CONFIGS } from "@/types/task-config";

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
  const config = TASK_CONFIGS[task];

  try {
    const replicate = getReplicateClient();
    const collection = await replicate.collections.get(config.collectionSlug);
    const models = (collection.models ?? [])
      .sort((a, b) => b.run_count - a.run_count)
      .slice(0, 20)
      .map((m) => ({
        owner: m.owner,
        name: m.name,
        description: m.description ?? null,
        coverImageUrl: m.cover_image_url ?? null,
        runCount: m.run_count,
        url: m.url,
      }));

    return NextResponse.json(models);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, code: "REPLICATE_ERROR" },
      { status: 502 }
    );
  }
}
