import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { inferences, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getPublicUrls } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const task = searchParams.get("task");
  const offset = (page - 1) * limit;

  const db = getDb();

  const conditions = [
    eq(inferences.isPublic, 1),
    eq(inferences.status, "succeeded"),
  ];

  if (task && ["text-to-image", "text-to-text", "text-to-sound"].includes(task)) {
    conditions.push(eq(inferences.taskType, task as "text-to-image" | "text-to-text" | "text-to-sound"));
  }

  const rows = await db
    .select({
      id: inferences.id,
      userAddress: inferences.userAddress,
      taskType: inferences.taskType,
      model: inferences.model,
      input: inferences.input,
      outputType: inferences.outputType,
      outputData: inferences.outputData,
      r2Keys: inferences.r2Keys,
      predictTimeMs: inferences.predictTimeMs,
      createdAt: inferences.createdAt,
    })
    .from(inferences)
    .where(and(...conditions))
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
