"use client";

import { useConnect, useAccount } from "wagmi";
import { useState } from "react";
import { Wallet, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { defaultChain } from "@/lib/wagmi";
import { useAuth } from "@/hooks/use-auth";
import { addAndSwitchToSepolia } from "@/lib/wallet-network";

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectDialog({ open, onOpenChange }: ConnectDialogProps) {
  const { connectors, connect, isPending } = useConnect();
  const { signIn } = useAuth();
  const { chain } = useAccount();
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  async function handleConnect(connector: (typeof connectors)[number]) {
    setSwitchError(null);
    connect(
      { connector },
      {
        onSuccess: async (data) => {
          if (data.chainId !== defaultChain.id) {
            setIsSwitching(true);
            try {
              // Use wallet_addEthereumChain as fallback for mobile wallets
              // This handles the case where Sepolia isn't pre-configured
              if (defaultChain.id === 11155111) {
                await addAndSwitchToSepolia();
              }
            } catch (error) {
              const errorMsg =
                error instanceof Error ? error.message : "Failed to switch network";
              setSwitchError(errorMsg);
              console.error("Network switch failed:", error);
              setIsSwitching(false);
              return;
            }
            setIsSwitching(false);
          }
          onOpenChange(false);
          // Automatically prompt SIWE sign-in right after connect
          signIn();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet on <strong>{defaultChain.name}</strong> to continue.
          </DialogDescription>
        </DialogHeader>

        {defaultChain.id === 11155111 && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 flex gap-2 text-sm text-blue-900 dark:text-blue-100">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                Your wallet will be prompted to add and switch to <strong>{defaultChain.name}</strong>.
              </p>
              <p className="text-xs mt-1 opacity-80">Chain ID: {defaultChain.id}</p>
            </div>
          </div>
        )}

        {switchError && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 flex gap-2 text-sm text-amber-900 dark:text-amber-100">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Network switch failed</p>
              <p className="text-xs mt-1">
                {switchError}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="outline"
              className="justify-start gap-3"
              disabled={isPending || isSwitching}
              onClick={() => handleConnect(connector)}
            >
              {isSwitching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wallet className="size-4" />
              )}
              {connector.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
