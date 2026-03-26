import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { freeInferenceGrants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  chainId: z.number(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const db = getDb();
  const address = auth.address.toLowerCase();

  try {
    const [existing] = await db
      .select()
      .from(freeInferenceGrants)
      .where(eq(freeInferenceGrants.address, address))
      .limit(1);

    if (existing) {
      await db
        .update(users)
        .set({ hasClaimedFreeInferences: true })
        .where(eq(users.address, address));

      return NextResponse.json({
        granted: false,
        creditAmount: existing.creditAmount,
        message: "You already claimed your free inferences.",
      });
    }

    const [grant] = await db
      .insert(freeInferenceGrants)
      .values({ address })
      .returning({ creditAmount: freeInferenceGrants.creditAmount });

    await db
      .update(users)
      .set({ hasClaimedFreeInferences: true })
      .where(eq(users.address, address));

    return NextResponse.json({
      granted: true,
      creditAmount: grant?.creditAmount ?? 5,
      message: "5 free inferences granted!",
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unknown error";
    console.error("[grant-free-credit] Error:", raw);
    return NextResponse.json(
      { error: "Failed to grant free inferences", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
