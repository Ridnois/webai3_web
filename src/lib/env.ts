import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_BASE_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL || undefined,
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL:
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || undefined,
});
