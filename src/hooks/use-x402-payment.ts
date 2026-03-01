"use client";

import { useState, useCallback } from "react";
import { useSignTypedData, useChainId, useAccount } from "wagmi";
import { getUsdcConfig } from "@/lib/contracts";

export type PaymentStatus = "idle" | "signing" | "signed" | "error";

interface PaymentRequirement {
  network: string;
  tokenAddress: string;
  tokenDecimals: number;
  receiverAddress: string;
  amountRequired: string;
  resource: string;
}

interface PaymentRequirementsResponse {
  x402Version: number;
  paymentRequirements: PaymentRequirement[];
}

const EIP712_DOMAIN_NAME = "USD Coin";
const EIP712_DOMAIN_VERSION = "2";

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

        // Decode the 402 response
        const decoded: PaymentRequirementsResponse = JSON.parse(
          atob(paymentRequirementsBase64)
        );
        const requirement = decoded.paymentRequirements[0];
        if (!requirement) {
          throw new Error("No payment requirements in 402 response");
        }

        if (!address) {
          throw new Error("Wallet not connected");
        }

        const usdcConfig = getUsdcConfig(chainId);
        if (!usdcConfig) {
          throw new Error(`No USDC config for chain ${chainId}`);
        }

        const nonce = generateNonce();
        const validAfter = "0";
        const validBefore = String(Math.floor(Date.now() / 1000) + 3600); // 1 hour

        const signature = await signTypedDataAsync({
          domain: {
            name: EIP712_DOMAIN_NAME,
            version: EIP712_DOMAIN_VERSION,
            chainId: BigInt(chainId),
            verifyingContract: usdcConfig.address,
          },
          types: TRANSFER_WITH_AUTHORIZATION_TYPES,
          primaryType: "TransferWithAuthorization",
          message: {
            from: address,
            to: requirement.receiverAddress as `0x${string}`,
            value: BigInt(requirement.amountRequired),
            validAfter: BigInt(validAfter),
            validBefore: BigInt(validBefore),
            nonce: nonce as `0x${string}`,
          },
        });

        // Build PaymentPayload and base64-encode it
        const paymentPayload = {
          x402Version: 2,
          payload: {
            signature,
            authorization: {
              from: address,
              to: requirement.receiverAddress,
              value: requirement.amountRequired,
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
