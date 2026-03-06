import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getPublicUrls } from "@/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid inference id", code: "INVALID_ID" },
      { status: 400 }
    );
  }

  try {
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
        status: inferences.status,
        errorMessage: inferences.errorMessage,
        predictTimeMs: inferences.predictTimeMs,
        createdAt: inferences.createdAt,
      })
      .from(inferences)
      .where(
        and(eq(inferences.id, id), eq(inferences.userAddress, auth.address))
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    let mediaUrls: string[] | null = null;
    const r2Keys = Array.isArray(row.r2Keys)
      ? row.r2Keys.filter((key): key is string => typeof key === "string" && key.length > 0)
      : [];

    if (r2Keys.length > 0) {
      mediaUrls = getPublicUrls(r2Keys);
    }

    return NextResponse.json({
      ...row,
      mediaUrls,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("[api/inferences/:id] Unexpected error:", message);
    return NextResponse.json(
      { error: message, code: "DETAIL_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
