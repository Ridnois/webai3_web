import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { sql, eq, count, avg, sum, max, countDistinct } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const db = getDb();
  const userFilter = eq(inferences.userAddress, auth.address);

  // Summary metrics
  const [summary] = await db
    .select({
      totalInferences: count(),
      successCount: count(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN 1 END`
      ),
      failedCount: count(
        sql`CASE WHEN ${inferences.status} = 'failed' THEN 1 END`
      ),
      totalTimeMs: sum(inferences.predictTimeMs),
      avgResponseMs: avg(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN ${inferences.predictTimeMs} END`
      ),
      modelsUsed: countDistinct(inferences.model),
      lastInference: max(inferences.createdAt),
    })
    .from(inferences)
    .where(userFilter);

  // Per-model breakdown
  const byModel = await db
    .select({
      model: inferences.model,
      totalCalls: count(),
      successCount: count(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN 1 END`
      ),
      avgResponseMs: avg(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN ${inferences.predictTimeMs} END`
      ),
      lastUsed: max(inferences.createdAt),
    })
    .from(inferences)
    .where(userFilter)
    .groupBy(inferences.model)
    .orderBy(sql`count(*) DESC`);

  // Per-task-type breakdown
  const byTask = await db
    .select({
      taskType: inferences.taskType,
      totalCalls: count(),
    })
    .from(inferences)
    .where(userFilter)
    .groupBy(inferences.taskType)
    .orderBy(sql`count(*) DESC`);

  return NextResponse.json({
    summary: {
      totalInferences: summary.totalInferences,
      successCount: summary.successCount,
      failedCount: summary.failedCount,
      totalTimeMs: summary.totalTimeMs ? Number(summary.totalTimeMs) : 0,
      avgResponseMs: summary.avgResponseMs
        ? Math.round(Number(summary.avgResponseMs))
        : null,
      modelsUsed: summary.modelsUsed,
      lastInference: summary.lastInference,
    },
    byModel: byModel.map((m) => ({
      ...m,
      avgResponseMs: m.avgResponseMs ? Math.round(Number(m.avgResponseMs)) : null,
    })),
    byTask,
  });
}
