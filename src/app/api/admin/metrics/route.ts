import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { sql, count, avg, max, sum, countDistinct } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const db = getDb();

  // Per-model metrics
  const modelMetrics = await db
    .select({
      model: inferences.model,
      totalCalls: count(),
      successCount: count(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN 1 END`
      ),
      failedCount: count(
        sql`CASE WHEN ${inferences.status} = 'failed' THEN 1 END`
      ),
      avgResponseMs: avg(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN ${inferences.predictTimeMs} END`
      ),
      lastUsed: max(inferences.createdAt),
    })
    .from(inferences)
    .groupBy(inferences.model)
    .orderBy(sql`count(*) DESC`);

  // Global summary
  const [summary] = await db
    .select({
      totalInferences: count(),
      uniqueModels: countDistinct(inferences.model),
      uniqueUsers: countDistinct(inferences.userAddress),
      avgResponseMs: avg(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN ${inferences.predictTimeMs} END`
      ),
      totalTimeMs: sum(inferences.predictTimeMs),
    })
    .from(inferences);

  return NextResponse.json({
    models: modelMetrics.map((m) => ({
      ...m,
      avgResponseMs: m.avgResponseMs ? Math.round(Number(m.avgResponseMs)) : null,
    })),
    summary: {
      ...summary,
      avgResponseMs: summary.avgResponseMs
        ? Math.round(Number(summary.avgResponseMs))
        : null,
      totalTimeMs: summary.totalTimeMs ? Number(summary.totalTimeMs) : 0,
    },
  });
}
