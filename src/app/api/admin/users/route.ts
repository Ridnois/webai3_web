import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { users, inferences, freeInferenceGrants } from "@/lib/db/schema";
import { sql, count, avg, sum, max, min, eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const db = getDb();

  // Per-address usage from inferences table
  const usageRows = await db
    .select({
      address: inferences.userAddress,
      totalInferences: count(),
      succeededCount: count(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN 1 END`
      ),
      failedCount: count(
        sql`CASE WHEN ${inferences.status} = 'failed' THEN 1 END`
      ),
      totalSpentUsdc: sum(inferences.actualCostUsdc),
      avgResponseMs: avg(
        sql`CASE WHEN ${inferences.status} = 'succeeded' THEN ${inferences.predictTimeMs} END`
      ),
      lastInference: max(inferences.createdAt),
      firstInference: min(inferences.createdAt),
      freeInferences: count(
        sql`CASE WHEN ${inferences.isFreeInference} = 1 THEN 1 END`
      ),
      textToImage: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-image' THEN 1 END`
      ),
      textToText: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-text' THEN 1 END`
      ),
      textToSound: count(
        sql`CASE WHEN ${inferences.taskType} = 'text-to-sound' THEN 1 END`
      ),
      uniqueModels: sql<number>`COUNT(DISTINCT ${inferences.model})`,
    })
    .from(inferences)
    .groupBy(inferences.userAddress)
    .orderBy(sql`count(*) DESC`);

  // User metadata (createdAt, lastSeenAt)
  const userRows = await db
    .select({
      address: users.address,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
      hasClaimedFreeInferences: users.hasClaimedFreeInferences,
    })
    .from(users);

  // Free inference grants
  const grantRows = await db
    .select({
      address: freeInferenceGrants.address,
      creditAmount: freeInferenceGrants.creditAmount,
      usedCount: freeInferenceGrants.usedCount,
    })
    .from(freeInferenceGrants);

  // Build lookup maps
  const userMap = new Map(userRows.map((u) => [u.address, u]));
  const grantMap = new Map(grantRows.map((g) => [g.address, g]));

  const result = usageRows.map((row) => {
    const user = userMap.get(row.address);
    const grant = grantMap.get(row.address);

    return {
      address: row.address,
      totalInferences: Number(row.totalInferences),
      succeededCount: Number(row.succeededCount),
      failedCount: Number(row.failedCount),
      totalSpentUsdc: row.totalSpentUsdc ? Number(row.totalSpentUsdc) : 0,
      avgResponseMs: row.avgResponseMs
        ? Math.round(Number(row.avgResponseMs))
        : null,
      lastInference: row.lastInference
        ? new Date(row.lastInference).toISOString()
        : null,
      firstInference: row.firstInference
        ? new Date(row.firstInference).toISOString()
        : null,
      freeInferences: Number(row.freeInferences),
      textToImage: Number(row.textToImage),
      textToText: Number(row.textToText),
      textToSound: Number(row.textToSound),
      uniqueModels: Number(row.uniqueModels),
      joinedAt: user?.createdAt
        ? new Date(user.createdAt).toISOString()
        : null,
      lastSeenAt: user?.lastSeenAt
        ? new Date(user.lastSeenAt).toISOString()
        : null,
      freeCreditsTotal: grant?.creditAmount ?? 0,
      freeCreditsUsed: grant?.usedCount ?? 0,
    };
  });

  return NextResponse.json({ users: result });
}
