import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getPublicUrls } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  const db = getDb();

  const rows = await db
    .select({
      id: inferences.id,
      taskType: inferences.taskType,
      model: inferences.model,
      input: inferences.input,
      outputType: inferences.outputType,
      outputData: inferences.outputData,
      r2Keys: inferences.r2Keys,
      status: inferences.status,
      predictTimeMs: inferences.predictTimeMs,
      isPublic: inferences.isPublic,
      createdAt: inferences.createdAt,
    })
    .from(inferences)
    .where(eq(inferences.userAddress, auth.address))
    .orderBy(desc(inferences.createdAt))
    .limit(limit)
    .offset(offset);

  const items = rows.map((row) => {
    const r2Keys = Array.isArray(row.r2Keys)
      ? row.r2Keys.filter((k): k is string => typeof k === "string" && k.length > 0)
      : [];

    return {
      ...row,
      mediaUrls: r2Keys.length > 0 ? getPublicUrls(r2Keys) : null,
    };
  });

  return NextResponse.json({ items, page, limit });
}
