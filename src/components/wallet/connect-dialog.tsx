"use client";

import { useConnect, useSwitchChain } from "wagmi";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { defaultChain } from "@/lib/wagmi";

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectDialog({ open, onOpenChange }: ConnectDialogProps) {
  const { connectors, connect, isPending } = useConnect();
  const { switchChain } = useSwitchChain();

  function handleConnect(connector: (typeof connectors)[number]) {
    connect(
      { connector },
      {
        onSuccess: (data) => {
          // If the wallet connected on a different chain, switch to the default
          if (data.chainId !== defaultChain.id) {
            switchChain({ chainId: defaultChain.id });
          }
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect a Wallet</DialogTitle>
          <DialogDescription>Choose a wallet to get started.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="outline"
              className="justify-start gap-3"
              disabled={isPending}
              onClick={() => handleConnect(connector)}
            >
              <Wallet className="size-4" />
              {connector.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
