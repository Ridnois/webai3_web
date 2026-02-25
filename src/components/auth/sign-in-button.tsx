"use client";

import { useAccount } from "wagmi";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

export function SignInButton() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isLoading, isSigningIn, signIn } = useAuth();

  if (!isConnected || isAuthenticated || isLoading) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={signIn}
      disabled={isSigningIn}
    >
      {isSigningIn ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Shield className="size-4" />
      )}
      {isSigningIn ? "Signing..." : "Sign In"}
    </Button>
  );
}
