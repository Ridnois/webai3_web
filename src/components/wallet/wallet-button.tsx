"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectDialog } from "@/components/wallet/connect-dialog";
import { WalletDetails } from "@/components/wallet/wallet-details";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

function StatusDot({ status }: { status: ConnectionStatus }) {
  const colors: Record<ConnectionStatus, string> = {
    disconnected:
      "bg-[oklch(0.60_0.20_25)] dark:bg-[oklch(0.68_0.18_22)]",
    connecting:
      "bg-[oklch(0.72_0.14_70)] dark:bg-[oklch(0.80_0.12_70)]",
    connected:
      "bg-[oklch(0.58_0.16_155)] dark:bg-[oklch(0.72_0.14_155)]",
  };

  return (
    <span
      className="absolute -right-1.5 -top-1.5 flex size-2"
      aria-label={`Wallet ${status}`}
    >
      {status === "connecting" && (
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full opacity-40 ${colors[status]}`}
        />
      )}
      <span
        className={`relative inline-flex size-2 rounded-full ring-[1.5px] ring-background ${colors[status]}`}
      />
    </span>
  );
}

function WalletIcon({
  status,
  className,
}: {
  status: ConnectionStatus;
  className?: string;
}) {
  return (
    <span className="relative inline-flex">
      <Wallet className={className} />
      <StatusDot status={status} />
    </span>
  );
}

export function WalletButton() {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const [dialogOpen, setDialogOpen] = useState(false);

  const status: ConnectionStatus =
    isConnected ? "connected" : isConnecting || isReconnecting ? "connecting" : "disconnected";

  if (isConnected) {
    return <WalletDetails status={status} />;
  }

  return (
    <>
      {/* Compact icon-only on small screens, full label on sm+ */}
      <Button
        size="icon"
        variant="outline"
        onClick={() => setDialogOpen(true)}
        className="sm:hidden size-8"
        aria-label="Connect wallet"
      >
        <WalletIcon status={status} className="size-4" />
      </Button>
      <Button
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="hidden gap-1.5 sm:inline-flex"
      >
        <WalletIcon status={status} className="size-3.5" />
        Connect to Run
      </Button>
      <ConnectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
