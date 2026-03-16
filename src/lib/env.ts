import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_ETHEREUM_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_SEPOLIA_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_ENABLE_DEV_CHAIN: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_ETHEREUM_RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || undefined,
  NEXT_PUBLIC_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || undefined,
  NEXT_PUBLIC_ENABLE_DEV_CHAIN:
    process.env.NEXT_PUBLIC_ENABLE_DEV_CHAIN || undefined,
});
