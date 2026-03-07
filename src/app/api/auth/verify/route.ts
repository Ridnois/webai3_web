import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  let body: { message: string; signature: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  if (!body.message || !body.signature) {
    return NextResponse.json(
      { error: "Missing message or signature", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const session = await getSession();

  // 1. Verify SIWE signature
  if (!session.nonce) {
    console.error("[auth/verify] No nonce in session — cookie may not have persisted from /api/auth/nonce");
    return NextResponse.json(
      { error: "Session nonce missing. Your session may have expired — please try again.", code: "NONCE_MISSING" },
      { status: 401 }
    );
  }

  let verified;
  try {
    const siweMessage = new SiweMessage(body.message);
    ({ data: verified } = await siweMessage.verify({
      signature: body.signature,
      nonce: session.nonce,
    }));
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const detail = raw.toLowerCase().includes("nonce")
      ? "Nonce mismatch — your session may have expired. Please try again."
      : raw.toLowerCase().includes("signature")
        ? "The wallet signature could not be verified."
        : raw;
    console.error("[auth/verify] SIWE verification failed:", raw);
    return NextResponse.json(
      { error: detail, code: "VERIFICATION_FAILED" },
      { status: 401 }
    );
  }

  // 2. Upsert user in database
  const address = verified.address.toLowerCase();
  try {
    const db = getDb();
    await db
      .insert(users)
      .values({ address })
      .onConflictDoUpdate({
        target: users.address,
        set: { lastSeenAt: new Date() },
      });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    console.error("[auth/verify] DB upsert failed:", raw);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later.", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  session.address = address;
  session.chainId = verified.chainId;
  session.nonce = undefined;
  await session.save();

  return NextResponse.json({ address, chainId: verified.chainId });
}
