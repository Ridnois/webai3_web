"use client";

import { useBalance, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { getUsdcConfig } from "@/lib/contracts";

interface WalletBalances {
  nativeFormatted: string | undefined;
  nativeSymbol: string | undefined;
  usdcFormatted: string | undefined;
  usdcRaw: bigint | undefined;
  isLoading: boolean;
}

export function useWalletBalances(
  address: `0x${string}` | undefined,
  chainId: number | undefined,
): WalletBalances {
  const usdcConfig = chainId ? getUsdcConfig(chainId) : undefined;

  const {
    data: nativeBalance,
    isLoading: nativeLoading,
  } = useBalance({
    address,
    query: {
      enabled: Boolean(address),
      retry: 2,
      retryDelay: 1500,
    },
  });

  const {
    data: usdcRaw,
    isLoading: usdcLoading,
  } = useReadContract({
    abi: erc20Abi,
    address: usdcConfig?.address,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && usdcConfig),
      retry: 2,
      retryDelay: 1500,
    },
  });

  const nativeFormatted = nativeBalance
    ? `${parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4)}`
    : undefined;

  const usdcFormatted =
    usdcRaw !== undefined && usdcConfig
      ? `${parseFloat(formatUnits(usdcRaw, usdcConfig.decimals)).toFixed(2)}`
      : undefined;

  return {
    nativeFormatted,
    nativeSymbol: nativeBalance?.symbol,
    usdcFormatted,
    usdcRaw,
    isLoading: nativeLoading || usdcLoading,
  };
}
