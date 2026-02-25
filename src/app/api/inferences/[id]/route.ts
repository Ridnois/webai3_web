import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getPresignedUrls } from "@/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select()
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
  if (row.r2Keys && row.r2Keys.length > 0) {
    mediaUrls = await getPresignedUrls(row.r2Keys);
  }

  return NextResponse.json({
    ...row,
    mediaUrls,
  });
}
