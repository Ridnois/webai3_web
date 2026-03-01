import { NextResponse } from "next/server";
import { getServerEnv } from "./server-env";
import { requireAuth } from "./auth";

function getAdminAddresses(): Set<string> {
  const raw = getServerEnv().ADMIN_ADDRESSES;
  return new Set(
    raw
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminAddress(address: string): boolean {
  return getAdminAddresses().has(address.toLowerCase());
}

export async function requireAdmin(): Promise<
  { address: string } | NextResponse
> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isAdminAddress(auth.address)) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  return { address: auth.address };
}
