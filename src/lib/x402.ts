import { z } from "zod";
import { mainnet, sepolia, foundry } from "viem/chains";
import { getUsdcConfig } from "./contracts";
import { getServerEnv } from "./server-env";
import { fetchWithTimeout } from "./fetch-with-timeout";

// ─── CAIP-2 network mapping ────────────────────────────────────────────────

const CAIP2_MAP: Record<number, string> = {
  [mainnet.id]: "eip155:1",
  [sepolia.id]: "eip155:11155111",
  // Local Anvil fork — maps to Sepolia for x402 facilitator compatibility
  [foundry.id]: "eip155:11155111",
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

// ─── Zod schemas (x402 v2) ──────────────────────────────────────────────────

const paymentRequirementBaseSchema = z.object({
  scheme: z.string(),
  network: z.string(),
  asset: z.string(),
  amount: z.string(),
  payTo: z.string(),
  maxTimeoutSeconds: z.number(),
  extra: z.record(z.unknown()).default({}),
});
// Use output type so `extra` is always `Record<string, unknown>` (never undefined)
export const paymentRequirementSchema = paymentRequirementBaseSchema;
export type PaymentRequirement = z.output<typeof paymentRequirementBaseSchema>;

export const resourceInfoSchema = z.object({
  url: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

export const paymentRequiredResponseSchema = z.object({
  x402Version: z.number(),
  resource: resourceInfoSchema,
  accepts: z.array(paymentRequirementSchema),
});
export type PaymentRequiredResponse = z.infer<typeof paymentRequiredResponseSchema>;

export const paymentPayloadSchema = z.object({
  x402Version: z.number(),
  accepted: paymentRequirementSchema,
  payload: z.record(z.unknown()),
});
export type PaymentPayload = z.output<typeof paymentPayloadSchema>;

export const settlementResponseSchema = z.object({
  success: z.boolean(),
  transaction: z.string().optional(),
  network: z.string().optional(),
  payer: z.string().optional(),
  errorReason: z.string().optional(),
});
export type SettlementResponse = z.infer<typeof settlementResponseSchema>;

// ─── Header encoding / decoding ─────────────────────────────────────────────

export function encodePaymentHeader(data: unknown): string {
  return btoa(JSON.stringify(data));
}

export function decodePaymentHeader<O, D extends z.ZodTypeDef, I>(
  base64: string,
  schema: z.ZodType<O, D, I>
): O {
  const json = JSON.parse(atob(base64));
  return schema.parse(json);
}

// ─── Build 402 PaymentRequirementsResponse ──────────────────────────────────

export function buildPaymentRequiredResponse(
  chainId: number,
  amountOnChain: bigint,
  resourceUrl: string
): PaymentRequiredResponse {
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
    resource: { url: resourceUrl },
    accepts: [
      {
        scheme: "exact",
        network,
        asset: usdcConfig.address,
        amount: amountOnChain.toString(),
        payTo: env.RECEIVER_ADDRESS,
        maxTimeoutSeconds: 60,
        extra: {
          // EIP-712 domain — name must match the contract's name() return value
          name: usdcConfig.eip712Name,
          version: "2",
        },
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
  paymentRequirements: PaymentRequirement
): Promise<VerifyResponse> {
  const env = getServerEnv();
  const res = await fetchWithTimeout(`${env.X402_FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: 2,
      paymentPayload,
      paymentRequirements,
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
  paymentRequirements: PaymentRequirement
): Promise<SettlementResponse> {
  const env = getServerEnv();
  const res = await fetchWithTimeout(`${env.X402_FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: 2,
      paymentPayload,
      paymentRequirements,
    }),
    timeoutMs: 30_000,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Facilitator /settle failed (${res.status}): ${text}`);
  }

  const data: SettlementResponse = await res.json();

  if (!data.success) {
    throw new Error(
      `Settlement rejected: ${data.errorReason ?? "unknown"}`
    );
  }

  return data;
}
