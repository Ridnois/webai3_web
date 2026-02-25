import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/server-env";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    const env = getServerEnv();
    const sql = postgres(env.DATABASE_URL);
    db = drizzle(sql, { schema });
  }
  return db;
}
