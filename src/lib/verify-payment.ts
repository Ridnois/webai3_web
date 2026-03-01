import { createPublicClient, http, type Address, type Chain } from "viem";
import { base, baseSepolia, foundry } from "viem/chains";
import { getUsdcConfig } from "./contracts";
import { getServerEnv } from "./server-env";

const chains: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [foundry.id]: foundry,
};

interface VerifyPaymentParams {
  txHash: `0x${string}`;
  chainId: number;
  expectedFrom: string;
  expectedAmountMin: bigint;
}

interface VerifyPaymentResult {
  valid: boolean;
  error?: string;
  actualAmount?: bigint;
}

export async function verifyPayment({
  txHash,
  chainId,
  expectedFrom,
  expectedAmountMin,
}: VerifyPaymentParams): Promise<VerifyPaymentResult> {
  const chain = chains[chainId];
  if (!chain) {
    return { valid: false, error: `Unsupported chain: ${chainId}` };
  }

  const usdcConfig = getUsdcConfig(chainId);
  if (!usdcConfig) {
    return { valid: false, error: `No USDC config for chain: ${chainId}` };
  }

  const env = getServerEnv();
  const receiverAddress = env.RECEIVER_ADDRESS.toLowerCase();

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    if (receipt.status !== "success") {
      return { valid: false, error: "Transaction reverted" };
    }

    // Find the ERC-20 Transfer event from the USDC contract
    const transferLogs = receipt.logs.filter(
      (log) =>
        log.address.toLowerCase() === usdcConfig.address.toLowerCase() &&
        log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );

    if (transferLogs.length === 0) {
      return { valid: false, error: "No USDC Transfer event found" };
    }

    // Decode and verify the transfer
    for (const log of transferLogs) {
      if (!log.topics[1] || !log.topics[2]) continue;
      const from = `0x${log.topics[1].slice(26)}`.toLowerCase();
      const to = `0x${log.topics[2].slice(26)}`.toLowerCase();
      const value = log.data && log.data !== "0x" ? BigInt(log.data) : BigInt(0);

      if (
        from === expectedFrom.toLowerCase() &&
        to === receiverAddress &&
        value >= expectedAmountMin
      ) {
        return { valid: true, actualAmount: value };
      }
    }

    return { valid: false, error: "Transfer does not match expected from, to, or amount" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { valid: false, error: `Failed to verify transaction: ${message}` };
  }
}
