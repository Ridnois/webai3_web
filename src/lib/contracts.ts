import type { Address } from "viem";
import { base, baseSepolia, foundry } from "viem/chains";

interface UsdcConfig {
  address: Address;
  decimals: number;
}

const usdcContracts: Record<number, UsdcConfig> = {
  [base.id]: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  [baseSepolia.id]: {
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
  },
  // Local dev chain (Anvil fork of Base Sepolia) — same USDC contract address
  [foundry.id]: {
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
  },
};

export function getUsdcConfig(chainId: number): UsdcConfig | undefined {
  return usdcContracts[chainId];
}
