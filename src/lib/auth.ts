import { NextResponse } from "next/server";
import { getSession } from "./session";

export async function getAuthenticatedAddress(): Promise<string | null> {
  const session = await getSession();
  return session.address ?? null;
}

export async function requireAuth(): Promise<
  { address: string } | NextResponse
> {
  const address = await getAuthenticatedAddress();
  if (!address) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  return { address };
}
