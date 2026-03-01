"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { toast } from "sonner";

interface AuthSession {
  address: string | null;
  chainId: number | null;
  isAdmin: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isConnected: boolean;
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  sessionAddress: string | null;
  isLoading: boolean;
  isSigningIn: boolean;
  signInError: Error | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<AuthSession> {
  const res = await fetch("/api/auth/session");
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
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
        throw new Error("Wallet not connected — please connect your wallet first.");
      }

      // 1. Get nonce from server
      let nonce: string;
      try {
        const nonceRes = await fetch("/api/auth/nonce");
        if (!nonceRes.ok) {
          throw new Error(`Server returned ${nonceRes.status}`);
        }
        ({ nonce } = await nonceRes.json());
      } catch (err) {
        if (err instanceof TypeError && err.message.includes("fetch")) {
          throw new Error("[Nonce] Cannot reach the server — check your network connection.");
        }
        throw new Error(`[Nonce] ${err instanceof Error ? err.message : "Failed to get sign-in nonce."}`);
      }

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

      // 3. Request wallet signature
      let signature: string;
      try {
        signature = await signMessageAsync({ message: messageString });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("denied")) {
          throw new Error("[Wallet] You rejected the signature request.");
        }
        throw new Error(`[Wallet] ${msg}`);
      }

      // 4. Verify signature on server
      let verifyRes: Response;
      try {
        verifyRes = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageString, signature }),
        });
      } catch {
        throw new Error("[Verify] Cannot reach the server — check your network connection.");
      }

      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        const status = verifyRes.status;
        const serverMsg = body.error ?? "Unknown error";
        if (status === 401) throw new Error(`[Verify] ${serverMsg}`);
        if (status === 500) throw new Error(`[Server] ${serverMsg}`);
        throw new Error(`[Verify] ${serverMsg} (${status})`);
      }

      return verifyRes.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth-session"], {
        address: data.address,
        chainId: data.chainId,
        isAdmin: false,
      });
      // Background refetch to get real isAdmin from session endpoint
      queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      toast.success("Signed in", {
        description: `Connected as ${data.address.slice(0, 6)}...${data.address.slice(-4)}`,
      });
    },
    onError: (error) => {
      const msg = error.message;
      // Parse the [Step] prefix for a descriptive title
      const match = msg.match(/^\[(\w+)]\s*(.+)$/);
      if (match) {
        const stepLabels: Record<string, string> = {
          Nonce: "Nonce request failed",
          Wallet: "Wallet signature failed",
          Verify: "Verification failed",
          Server: "Server error",
        };
        toast.error(stepLabels[match[1]] ?? "Sign-in failed", {
          description: match[2],
        });
      } else {
        toast.error("Sign-in failed", { description: msg });
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status} — could not end session.`);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth-session"], {
        address: null,
        chainId: null,
        isAdmin: false,
      });
    },
    onError: (error) => {
      toast.error("Sign-out failed", {
        description: error.message,
      });
    },
  });

  // Stable callback refs — identity never changes across renders
  const signInMutateRef = useRef(signInMutation.mutate);
  signInMutateRef.current = signInMutation.mutate;

  const signOutMutateRef = useRef(signOutMutation.mutate);
  signOutMutateRef.current = signOutMutation.mutate;

  const signIn = useCallback(() => signInMutateRef.current(), []);
  const signOut = useCallback(() => signOutMutateRef.current(), []);

  // Auto sign-out when wallet actively disconnects (not on initial load)
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current && isAuthenticated) {
      // Only sign out if wallet was previously connected and is now disconnected
      signOut();
    }
  }, [isConnected, isAuthenticated, signOut]);

  const value: AuthContextValue = {
    isAuthenticated,
    isAdmin: session.data?.isAdmin ?? false,
    isConnected,
    address,
    chainId,
    sessionAddress: session.data?.address ?? null,
    isLoading: session.isLoading,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error,
    signIn,
    signOut,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
