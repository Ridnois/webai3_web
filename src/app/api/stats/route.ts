import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { count, sum, countDistinct } from "drizzle-orm";

export async function GET() {
  const db = getDb();

  const [row] = await db
    .select({
      totalInferences: count(),
      totalTimeMs: sum(inferences.predictTimeMs),
      totalUsers: countDistinct(inferences.userAddress),
    })
    .from(inferences);

  return NextResponse.json({
    totalInferences: row.totalInferences,
    totalTimeMs: row.totalTimeMs ? Number(row.totalTimeMs) : 0,
    totalUsers: row.totalUsers,
  });
}
