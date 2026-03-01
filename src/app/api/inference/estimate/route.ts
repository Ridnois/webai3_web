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
  const env = getServerEnv();
  const ratePerSec = parseFloat(env.INFERENCE_RATE_PER_SEC);

  // Query historical average predict time for succeeded inferences of this task
  const db = getDb();
  const [result] = await db
    .select({ avgMs: avg(inferences.predictTimeMs) })
    .from(inferences)
    .where(
      and(
        eq(inferences.taskType, task),
        eq(inferences.status, "succeeded"),
      ),
    );

  const avgMs = result?.avgMs != null ? parseFloat(result.avgMs) : null;
  const fallbackSeconds = TASK_CONFIGS[task].estimatedSeconds;
  const estimatedSeconds = avgMs ? avgMs / 1000 : fallbackSeconds;
  const source = avgMs ? "historical" : "default";

  const cost = estimateCostUsdc(task, ratePerSec, estimatedSeconds);

  return NextResponse.json({
    task,
    estimatedCostUsdc: cost,
    ratePerSec,
    estimatedSeconds,
    source,
  });
}
