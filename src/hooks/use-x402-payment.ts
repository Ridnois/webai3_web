"use client";

import { useState, useCallback } from "react";
import { useSignTypedData, useChainId, useAccount } from "wagmi";
import { getUsdcConfig } from "@/lib/contracts";

export type PaymentStatus = "idle" | "signing" | "signed" | "error";

// x402 v2 types
interface PaymentRequirement {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

interface PaymentRequiredResponse {
  x402Version: number;
  resource: { url: string };
  accepts: PaymentRequirement[];
}

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  );
}

export function useX402Payment() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [paymentHeader, setPaymentHeader] = useState<string | null>(null);

  const { signTypedDataAsync } = useSignTypedData();

  const signPayment = useCallback(
    async (paymentRequirementsBase64: string) => {
      try {
        setStatus("signing");
        setError(null);
        setPaymentHeader(null);

        // Decode the 402 response (x402 v2 format)
        const decoded: PaymentRequiredResponse = JSON.parse(
          atob(paymentRequirementsBase64)
        );
        const accepted = decoded.accepts[0];
        if (!accepted) {
          throw new Error("No payment requirements in 402 response");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        const usdcConfig = getUsdcConfig(chainId);
        if (!usdcConfig) {
          throw new Error(`No USDC config for chain ${chainId}`);
        }

        // Read EIP-712 domain from the payment requirement's extra field
        const domainName = (accepted.extra?.name as string) || "USD Coin";
        const domainVersion = (accepted.extra?.version as string) || "2";

        const nonce = generateNonce();
        const now = Math.floor(Date.now() / 1000);
        const validAfter = (now - 600).toString(); // 10 min grace for clock skew
        const validBefore = String(now + accepted.maxTimeoutSeconds);

        const signature = await signTypedDataAsync({
          domain: {
            name: domainName,
            version: domainVersion,
            chainId: BigInt(chainId),
            verifyingContract: usdcConfig.address,
          },
          types: TRANSFER_WITH_AUTHORIZATION_TYPES,
          primaryType: "TransferWithAuthorization",
          message: {
            from: address,
            to: accepted.payTo as `0x${string}`,
            value: BigInt(accepted.amount),
            validAfter: BigInt(validAfter),
            validBefore: BigInt(validBefore),
            nonce: nonce as `0x${string}`,
          },
        });

        // Build x402 v2 PaymentPayload
        const paymentPayload = {
          x402Version: 2,
          accepted,
          payload: {
            signature,
            authorization: {
              from: address,
              to: accepted.payTo,
              value: accepted.amount,
              validAfter,
              validBefore,
              nonce,
            },
          },
        };

        const encoded = btoa(JSON.stringify(paymentPayload));
        setPaymentHeader(encoded);
        setStatus("signed");
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
    },
    [chainId, address, signTypedDataAsync]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPaymentHeader(null);
  }, []);

  return {
    signPayment,
    status,
    paymentHeader,
    error,
    reset,
  };
}
