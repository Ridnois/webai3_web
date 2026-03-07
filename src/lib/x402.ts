import { z } from "zod";
import { base, baseSepolia, foundry } from "viem/chains";
import { getUsdcConfig } from "./contracts";
import { getServerEnv } from "./server-env";
import { fetchWithTimeout } from "./fetch-with-timeout";

// ─── CAIP-2 network mapping ────────────────────────────────────────────────

const CAIP2_MAP: Record<number, string> = {
  [base.id]: "eip155:8453",
  [baseSepolia.id]: "eip155:84532",
  // Local Anvil fork — maps to Base Sepolia for x402 facilitator compatibility
  [foundry.id]: "eip155:84532",
};

const CHAIN_ID_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(CAIP2_MAP).map(([k, v]) => [v, Number(k)])
);

export function chainIdToCaip2(chainId: number): string | undefined {
  return CAIP2_MAP[chainId];
}

export function caip2ToChainId(caip2: string): number | undefined {
  return CHAIN_ID_MAP[caip2];
}

// ─── Zod schemas ────────────────────────────────────────────────────────────

export const paymentRequirementSchema = z.object({
  network: z.string(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  receiverAddress: z.string(),
  amountRequired: z.string(),
  resource: z.string(),
});
export type PaymentRequirement = z.infer<typeof paymentRequirementSchema>;

export const paymentRequirementsResponseSchema = z.object({
  x402Version: z.number(),
  paymentRequirements: z.array(paymentRequirementSchema),
});
export type PaymentRequirementsResponse = z.infer<typeof paymentRequirementsResponseSchema>;

export const paymentPayloadSchema = z.object({
  x402Version: z.number(),
  payload: z.object({
    signature: z.string(),
    authorization: z.object({
      from: z.string(),
      to: z.string(),
      value: z.string(),
      validAfter: z.string(),
      validBefore: z.string(),
      nonce: z.string(),
    }),
  }),
});
export type PaymentPayload = z.infer<typeof paymentPayloadSchema>;

export const settlementResponseSchema = z.object({
  success: z.boolean(),
  transaction: z.string().optional(),
  network: z.string().optional(),
  payer: z.string().optional(),
});
export type SettlementResponse = z.infer<typeof settlementResponseSchema>;

// ─── Header encoding / decoding ─────────────────────────────────────────────

export function encodePaymentHeader(data: unknown): string {
  return btoa(JSON.stringify(data));
}

export function decodePaymentHeader<T>(
  base64: string,
  schema: z.ZodType<T>
): T {
  const json = JSON.parse(atob(base64));
  return schema.parse(json);
}

// ─── Build 402 PaymentRequirementsResponse ──────────────────────────────────

export function buildPaymentRequirementsResponse(
  chainId: number,
  amountOnChain: bigint,
  resourceUrl: string
): PaymentRequirementsResponse {
  const network = chainIdToCaip2(chainId);
  if (!network) {
    throw new Error(`Unsupported chain for x402: ${chainId}`);
  }

  const usdcConfig = getUsdcConfig(chainId);
  if (!usdcConfig) {
    throw new Error(`No USDC config for chain: ${chainId}`);
  }

  const env = getServerEnv();

  return {
    x402Version: 2,
    paymentRequirements: [
      {
        network,
        tokenAddress: usdcConfig.address,
        tokenDecimals: usdcConfig.decimals,
        receiverAddress: env.RECEIVER_ADDRESS,
        amountRequired: amountOnChain.toString(),
        resource: resourceUrl,
      },
    ],
  };
}

// ─── Facilitator API calls ──────────────────────────────────────────────────

interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

export async function verifyWithFacilitator(
  paymentPayload: PaymentPayload,
  paymentRequirement: PaymentRequirement
): Promise<VerifyResponse> {
  const env = getServerEnv();
  const res = await fetchWithTimeout(`${env.X402_FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: 2,
      paymentPayload,
      paymentRequirements: paymentRequirement,
    }),
    timeoutMs: 15_000,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Facilitator /verify failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function settleWithFacilitator(
  paymentPayload: PaymentPayload,
  paymentRequirement: PaymentRequirement
): Promise<SettlementResponse> {
  const env = getServerEnv();
  const res = await fetchWithTimeout(`${env.X402_FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: 2,
      paymentPayload,
      paymentRequirements: paymentRequirement,
    }),
    timeoutMs: 30_000,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Facilitator /settle failed (${res.status}): ${text}`);
  }

  return res.json();
}
