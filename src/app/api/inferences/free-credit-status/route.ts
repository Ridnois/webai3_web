import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { freeInferenceGrants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const db = getDb();

  try {
    const [grant] = await db
      .select()
      .from(freeInferenceGrants)
      .where(eq(freeInferenceGrants.address, auth.address))
      .limit(1);

    if (!grant) {
      return NextResponse.json({
        hasFreeCredit: false,
        remainingCredit: 0,
        grantedAt: null,
        expiresAt: null,
      });
    }

    const remaining = Math.max(0, grant.creditAmount - grant.usedCount);

    return NextResponse.json({
      hasFreeCredit: remaining > 0,
      remainingCredit: remaining,
      grantedAt: grant.grantedAt ? grant.grantedAt.toISOString() : null,
      expiresAt: grant.expiresAt ? grant.expiresAt.toISOString() : null,
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unknown error";
    console.error("[free-credit-status] Error:", raw);
    return NextResponse.json(
      { error: "Failed to fetch free credit status", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
