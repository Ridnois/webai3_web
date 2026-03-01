import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminAddress } from "@/lib/admin";

export async function GET() {
  const session = await getSession();
  const address = session.address ?? null;

  return NextResponse.json({
    address,
    chainId: session.chainId ?? null,
    isAdmin: address ? isAdminAddress(address) : false,
  });
}
