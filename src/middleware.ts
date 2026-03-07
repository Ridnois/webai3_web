import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/auth/nonce": { max: 10, windowMs: 60_000 },
  "/api/auth/verify": { max: 10, windowMs: 60_000 },
  "/api/inference": { max: 20, windowMs: 60_000 },
  "/api/admin/metrics": { max: 30, windowMs: 60_000 },
};

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  const limitConfig = RATE_LIMITS[pathname];
  if (limitConfig) {
    const ip = getClientIp(request);
    const key = `${ip}:${pathname}`;
    const result = checkRateLimit(key, limitConfig.max, limitConfig.windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
