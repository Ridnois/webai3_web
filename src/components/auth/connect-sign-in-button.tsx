"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ConnectDialog } from "@/components/wallet/connect-dialog";
import { Shield, Wallet, Loader2 } from "lucide-react";

interface ConnectSignInButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Single button that handles both wallet connection and SIWE sign-in.
 * - Wallet not connected → opens ConnectDialog (which auto-triggers sign-in after connect)
 * - Wallet connected but not authenticated → calls signIn() directly
 */
export function ConnectSignInButton({
  variant = "outline",
  size = "default",
  className,
}: ConnectSignInButtonProps) {
  const { isConnected, isSigningIn, signIn } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isConnected) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setDialogOpen(true)}
        >
          <Wallet className="size-4" />
          Connect Wallet
        </Button>
        <ConnectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
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
