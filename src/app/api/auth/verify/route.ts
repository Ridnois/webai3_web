import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  try {
    const siweMessage = new SiweMessage(body.message);
    const { data: verified } = await siweMessage.verify({
      signature: body.signature,
      nonce: session.nonce,
    });

    const address = verified.address.toLowerCase();
    const db = getDb();

    // Upsert user
    await db
      .insert(users)
      .values({ address })
      .onConflictDoUpdate({
        target: users.address,
        set: { lastSeenAt: new Date() },
      });

    session.address = address;
    session.chainId = verified.chainId;
    session.nonce = undefined;
    await session.save();

    return NextResponse.json({ address, chainId: verified.chainId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json(
      { error: message, code: "VERIFICATION_FAILED" },
      { status: 401 }
    );
  }
}
