import { createConfig, http } from "wagmi";
import { base, baseSepolia, foundry } from "viem/chains";
import type { Chain, Transport } from "viem";

const enableDevChain = process.env.NEXT_PUBLIC_ENABLE_DEV_CHAIN === "true";

export const chains: readonly [Chain, ...Chain[]] = enableDevChain
  ? [foundry, base, baseSepolia]
  : [base, baseSepolia];

export const defaultChain = chains[0];

const transports: Record<number, Transport> = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
};

if (enableDevChain) {
  transports[foundry.id] = http("http://127.0.0.1:8545");
}

export const wagmiConfig = createConfig({
  chains,
  transports: transports as Record<(typeof chains)[number]["id"], Transport>,
  ssr: true,
});
