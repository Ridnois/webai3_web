import { z } from "zod";

const serverEnvSchema = z.object({
  REPLICATE_API_TOKEN: z.string().min(1, "REPLICATE_API_TOKEN is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  ADMIN_ADDRESSES: z.string().optional().default(""),
  RECEIVER_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, "RECEIVER_ADDRESS must be a valid Ethereum address"),
  INFERENCE_RATE_PER_SEC: z.string().optional().default("0.001"),
});

export function getServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(
      `Missing server environment variables:\n${JSON.stringify(formatted, null, 2)}`
    );
  }
  return result.data;
}
