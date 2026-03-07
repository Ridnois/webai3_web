import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getPublicUrls } from "@/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid id", code: "INVALID_ID" },
      { status: 400 }
    );
  }

  const db = getDb();

  const [row] = await db
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
    .where(and(eq(inferences.id, id), eq(inferences.isPublic, 1), eq(inferences.status, "succeeded")))
    .limit(1);

  if (!row) {
    return NextResponse.json(
      { error: "Not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const r2Keys = Array.isArray(row.r2Keys)
    ? row.r2Keys.filter((k): k is string => typeof k === "string" && k.length > 0)
    : [];

  return NextResponse.json({
    ...row,
    mediaUrls: r2Keys.length > 0 ? getPublicUrls(r2Keys) : null,
  });
}
