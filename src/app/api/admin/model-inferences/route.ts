import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const model = request.nextUrl.searchParams.get("model");
  if (!model) {
    return NextResponse.json({ error: "model is required" }, { status: 400 });
  }

  const db = getDb();

  const rows = await db
    .select({
      id: inferences.id,
      createdAt: inferences.createdAt,
      predictTimeMs: inferences.predictTimeMs,
      status: inferences.status,
      actualCostUsdc: inferences.actualCostUsdc,
      userAddress: inferences.userAddress,
    })
    .from(inferences)
    .where(eq(inferences.model, model))
    .orderBy(desc(inferences.createdAt))
    .limit(500);

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      predictTimeMs: r.predictTimeMs ?? null,
      status: r.status,
      actualCostUsdc: r.actualCostUsdc ? Number(r.actualCostUsdc) : null,
      userAddress: r.userAddress.slice(0, 8) + "…",
    }))
  );
}
