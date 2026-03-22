import { createConfig, http } from "wagmi";
import { mainnet, sepolia, foundry } from "viem/chains";
import type { Chain, Transport } from "viem";
import { env } from "@/lib/env";

const enableDevChain = process.env.NEXT_PUBLIC_ENABLE_DEV_CHAIN === "true";

export const chains: readonly [Chain, ...Chain[]] = enableDevChain
  ? [foundry, mainnet, sepolia]
  : [mainnet, sepolia];

// Determine default chain based on NEXT_PUBLIC_TARGET_CHAIN_ID env var
// Defaults to Sepolia (11155111) for staging, can be overridden to Mainnet (1) for production
const getDefaultChain = (): Chain => {
  const targetChainId = env.NEXT_PUBLIC_TARGET_CHAIN_ID
    ? parseInt(env.NEXT_PUBLIC_TARGET_CHAIN_ID, 10)
    : 11155111; // Default to Sepolia for staging

  const chain = chains.find((c) => c.id === targetChainId);
  if (!chain) {
    console.warn(
      `Target chain ${targetChainId} not found in supported chains, defaulting to Sepolia`
    );
    return sepolia;
  }
  return chain;
};

export const defaultChain = getDefaultChain();

const transports: Record<number, Transport> = {
  [mainnet.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || undefined),
  [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || undefined),
};

if (enableDevChain) {
  transports[foundry.id] = http("http://127.0.0.1:8545");
}

export const wagmiConfig = createConfig({
  chains,
  transports: transports as Record<(typeof chains)[number]["id"], Transport>,
  ssr: true,
});
