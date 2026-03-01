"use client";

import { useState, useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { erc20Abi, type Address } from "viem";
import { getUsdcConfig } from "@/lib/contracts";
import { usdcToOnChainAmount } from "@/lib/pricing";

export type PaymentStatus =
  | "idle"
  | "approving"
  | "confirming"
  | "confirmed"
  | "error";

export function useUsdcPayment(receiverAddress: string) {
  const chainId = useChainId();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const {
    writeContract,
    data: txHash,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  // Transition to "confirmed" when tx receipt arrives
  useEffect(() => {
    if (isConfirmed && status === "confirming") {
      setStatus("confirmed");
    }
  }, [isConfirmed, status]);

  const sendPayment = useCallback(
    (amountUsdc: number) => {
      const usdcConfig = getUsdcConfig(chainId);
      if (!usdcConfig) {
        setError(new Error(`No USDC contract for chain ${chainId}`));
        setStatus("error");
        return;
      }

      setStatus("approving");
      setError(null);

      const onChainAmount = usdcToOnChainAmount(amountUsdc);

      writeContract(
        {
          abi: erc20Abi,
          address: usdcConfig.address,
          functionName: "transfer",
          args: [receiverAddress as Address, onChainAmount],
        },
        {
          onSuccess: () => {
            setStatus("confirming");
          },
          onError: (err) => {
            setError(err instanceof Error ? err : new Error(String(err)));
            setStatus("error");
          },
        },
      );
    },
    [chainId, receiverAddress, writeContract],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    resetWrite();
  }, [resetWrite]);

  return {
    sendPayment,
    status,
    txHash,
    chainId,
    error,
    reset,
  };
}
