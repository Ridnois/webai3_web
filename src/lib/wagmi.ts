import { createConfig, http } from "wagmi";
import { base, baseSepolia, foundry } from "viem/chains";
import type { Chain, Transport } from "viem";

const enableDevChain = process.env.NEXT_PUBLIC_ENABLE_DEV_CHAIN === "true";

const chains: readonly [Chain, ...Chain[]] = enableDevChain
  ? [base, baseSepolia, foundry]
  : [base, baseSepolia];

const transports: Record<number, Transport> = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
};

if (enableDevChain) {
  transports[foundry.id] = http();
}

export const wagmiConfig = createConfig({
  chains,
  transports: transports as Record<(typeof chains)[number]["id"], Transport>,
  ssr: true,
});
