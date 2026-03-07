import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { getServerEnv } from "./server-env";

export interface SessionData {
  address?: string;
  chainId?: number;
  nonce?: string;
}

const COOKIE_NAME = "web3ai_session";

function getSessionOptions() {
  const env = getServerEnv();
  return {
    password: env.SESSION_SECRET,
    cookieName: COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24, // 24 hours
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
