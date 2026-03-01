"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";

export function SignInButton() {
  const { isAuthenticated, isLoading, isConnected, isSigningIn, signIn } = useAuth();

  if (!isConnected || isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <Badge variant="secondary" className="gap-1.5 py-1">
        <ShieldCheck className="size-3.5 text-green-500" />
        Connected
      </Badge>
    );
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
