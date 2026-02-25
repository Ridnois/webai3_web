"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ConnectDialog } from "@/components/wallet/connect-dialog";
import { WalletDetails } from "@/components/wallet/wallet-details";

export function WalletButton() {
  const { isConnected } = useAccount();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isConnected) {
    return <WalletDetails />;
  }

  return (
    <>
      <Button size="sm" onClick={() => setDialogOpen(true)}>
        Connect Wallet
      </Button>
      <ConnectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
