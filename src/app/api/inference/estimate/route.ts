import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { getServerEnv } from "@/lib/server-env";
import { estimateCostUsdc } from "@/lib/pricing";
import { taskTypeSchema } from "@/types/inference";
import { TASK_CONFIGS } from "@/types/task-config";
import { eq, avg, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const taskParam = request.nextUrl.searchParams.get("task");
  const parsed = taskTypeSchema.safeParse(taskParam);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid or missing task parameter", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const task = parsed.data;
  const model = request.nextUrl.searchParams.get("model");
  const env = getServerEnv();
  const ratePerSec = parseFloat(env.INFERENCE_RATE_PER_SEC);

  const db = getDb();

  // Try model-specific average first (if model provided)
  let avgMs: number | null = null;
  let source: "model" | "historical" | "default" = "default";

  if (model) {
    const [modelResult] = await db
      .select({ avgMs: avg(inferences.predictTimeMs) })
      .from(inferences)
      .where(
        and(
          eq(inferences.model, model),
          eq(inferences.status, "succeeded"),
        ),
      );

    if (modelResult?.avgMs != null) {
      avgMs = parseFloat(modelResult.avgMs);
      source = "model";
    }
  }

  // Fall back to task-wide average
  if (avgMs == null) {
    const [taskResult] = await db
      .select({ avgMs: avg(inferences.predictTimeMs) })
      .from(inferences)
      .where(
        and(
          eq(inferences.taskType, task),
          eq(inferences.status, "succeeded"),
        ),
      );

    if (taskResult?.avgMs != null) {
      avgMs = parseFloat(taskResult.avgMs);
      source = "historical";
    }
  }

  const fallbackSeconds = TASK_CONFIGS[task].estimatedSeconds;
  const estimatedSeconds = avgMs ? avgMs / 1000 : fallbackSeconds;

  const cost = estimateCostUsdc(task, ratePerSec, estimatedSeconds);

  return NextResponse.json({
    task,
    model: model ?? null,
    estimatedCostUsdc: cost,
    ratePerSec,
    estimatedSeconds,
    source,
  });
}
