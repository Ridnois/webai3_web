import { createConfig, http } from "wagmi";
import { mainnet, sepolia, foundry } from "viem/chains";
import type { Chain, Transport } from "viem";

const enableDevChain = process.env.NEXT_PUBLIC_ENABLE_DEV_CHAIN === "true";

export const chains: readonly [Chain, ...Chain[]] = enableDevChain
  ? [foundry, mainnet, sepolia]
  : [mainnet, sepolia];

export const defaultChain = chains[0];

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
