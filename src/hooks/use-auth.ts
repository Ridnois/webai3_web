"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

interface AuthSession {
  address: string | null;
  chainId: number | null;
}

async function fetchSession(): Promise<AuthSession> {
  const res = await fetch("/api/auth/session");
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
  });

  const isAuthenticated = Boolean(session.data?.address);

  const signInMutation = useMutation({
    mutationFn: async () => {
      if (!address || !chainId) {
        throw new Error("Wallet not connected");
      }

      // 1. Get nonce
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      // 2. Build SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to web3-ai",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const messageString = message.prepareMessage();

      // 3. Sign
      const signature = await signMessageAsync({ message: messageString });

      // 4. Verify
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageString, signature }),
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Verification failed");
      }

      return verifyRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-session"] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-session"] });
    },
  });

  const signIn = useCallback(() => {
    signInMutation.mutate();
  }, [signInMutation]);

  const signOut = useCallback(() => {
    signOutMutation.mutate();
  }, [signOutMutation]);

  // Auto sign-out when wallet disconnects
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      signOutMutation.mutate();
    }
  }, [isConnected, isAuthenticated, signOutMutation]);

  return {
    isAuthenticated,
    sessionAddress: session.data?.address ?? null,
    isLoading: session.isLoading,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error,
    signIn,
    signOut,
  };
}
