import type { Address } from "viem";
import { mainnet, sepolia, foundry } from "viem/chains";

interface UsdcConfig {
  address: Address;
  decimals: number;
}

const usdcContracts: Record<number, UsdcConfig> = {
  [mainnet.id]: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
  },
  [sepolia.id]: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
  },
  // Local dev chain (Anvil fork of Sepolia) — same USDC contract address
  [foundry.id]: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
  },
};

export function getUsdcConfig(chainId: number): UsdcConfig | undefined {
  return usdcContracts[chainId];
}
