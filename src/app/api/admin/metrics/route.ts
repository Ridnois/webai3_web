import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { sql, count, avg, max, sum, countDistinct, gte } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const db = getDb();

  // Per-model metrics
  const modelMetrics = await db
    .select({
      model: inferences.model,
      taskType: inferences.taskType,
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
      totalRevenueUsdc: sum(inferences.actualCostUsdc),
      lastUsed: max(inferences.createdAt),
    })
    .from(inferences)
    .groupBy(inferences.model, inferences.taskType)
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
      totalRevenueUsdc: sum(inferences.actualCostUsdc),
      totalEstimatedUsdc: sum(inferences.estimatedCostUsdc),
      succeededCount: count(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN 1 END`
      ),
      failedCount: count(
        sql`CASE WHEN ${inferences.status} = 'failed' THEN 1 END`
      ),
    })
    .from(inferences);

  // Task type breakdown
  const taskBreakdownRows = await db
    .select({
      taskType: inferences.taskType,
      count: count(),
      revenue: sum(inferences.actualCostUsdc),
    })
    .from(inferences)
    .groupBy(inferences.taskType);

  // Daily metrics — last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyRows = await db
    .select({
      date: sql<string>`DATE(${inferences.createdAt})`,
      total: count(),
      succeeded: count(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN 1 END`
      ),
      failed: count(
        sql`CASE WHEN ${inferences.status} = 'failed' THEN 1 END`
      ),
      revenue: sum(inferences.actualCostUsdc),
      textToImage: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-image' THEN 1 END`
      ),
      textToText: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-text' THEN 1 END`
      ),
      textToSound: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-sound' THEN 1 END`
      ),
    })
    .from(inferences)
    .where(gte(inferences.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${inferences.createdAt})`)
    .orderBy(sql`DATE(${inferences.createdAt}) ASC`);

  // Hourly metrics — last 48 hours
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const hourlyRows = await db
    .select({
      hour: sql<string>`date_trunc('hour', ${inferences.createdAt})`,
      total: count(),
      succeeded: count(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN 1 END`
      ),
      failed: count(
        sql`CASE WHEN ${inferences.status} = 'failed' THEN 1 END`
      ),
      revenue: sum(inferences.actualCostUsdc),
      textToImage: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-image' THEN 1 END`
      ),
      textToText: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-text' THEN 1 END`
      ),
      textToSound: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-sound' THEN 1 END`
      ),
    })
    .from(inferences)
    .where(gte(inferences.createdAt, fortyEightHoursAgo))
    .groupBy(sql`date_trunc('hour', ${inferences.createdAt})`)
    .orderBy(sql`date_trunc('hour', ${inferences.createdAt}) ASC`);

  return NextResponse.json({
    models: modelMetrics.map((m) => ({
      ...m,
      avgResponseMs: m.avgResponseMs ? Math.round(Number(m.avgResponseMs)) : null,
      totalRevenueUsdc: m.totalRevenueUsdc ? Number(m.totalRevenueUsdc) : 0,
    })),
    summary: {
      ...summary,
      avgResponseMs: summary.avgResponseMs
        ? Math.round(Number(summary.avgResponseMs))
        : null,
      totalTimeMs: summary.totalTimeMs ? Number(summary.totalTimeMs) : 0,
      totalRevenueUsdc: summary.totalRevenueUsdc ? Number(summary.totalRevenueUsdc) : 0,
      totalEstimatedUsdc: summary.totalEstimatedUsdc ? Number(summary.totalEstimatedUsdc) : 0,
    },
    taskBreakdown: taskBreakdownRows.map((r) => ({
      taskType: r.taskType,
      count: Number(r.count),
      revenue: r.revenue ? Number(r.revenue) : 0,
    })),
    dailyMetrics: dailyRows.map((r) => ({
      date: r.date,
      total: Number(r.total),
      succeeded: Number(r.succeeded),
      failed: Number(r.failed),
      revenue: r.revenue ? Number(r.revenue) : 0,
      textToImage: Number(r.textToImage),
      textToText: Number(r.textToText),
      textToSound: Number(r.textToSound),
    })),
    hourlyMetrics: hourlyRows.map((r) => ({
      date: r.hour,
      total: Number(r.total),
      succeeded: Number(r.succeeded),
      failed: Number(r.failed),
      revenue: r.revenue ? Number(r.revenue) : 0,
      textToImage: Number(r.textToImage),
      textToText: Number(r.textToText),
      textToSound: Number(r.textToSound),
    })),
  });
}
