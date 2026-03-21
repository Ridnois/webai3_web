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
import { useAuth } from "@/hooks/use-auth";

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectDialog({ open, onOpenChange }: ConnectDialogProps) {
  const { connectors, connect, isPending } = useConnect();
  const { switchChain } = useSwitchChain();
  const { signIn } = useAuth();

  function handleConnect(connector: (typeof connectors)[number]) {
    connect(
      { connector },
      {
        onSuccess: (data) => {
          if (data.chainId !== defaultChain.id) {
            switchChain({ chainId: defaultChain.id });
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
          <DialogTitle>Connect &amp; Sign In</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect, then sign a message to authenticate.
          </DialogDescription>
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
