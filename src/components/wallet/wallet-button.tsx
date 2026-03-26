"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectDialog } from "@/components/wallet/connect-dialog";
import { WalletDetails } from "@/components/wallet/wallet-details";
import { addAndSwitchToSepolia } from "@/lib/wallet-network";
import { defaultChain } from "@/lib/wagmi";
import { useAuth } from "@/hooks/use-auth";

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
  const { connectors, connectAsync, isPending: isConnectPending } = useConnect();
  const { signIn } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isQuickConnecting, setIsQuickConnecting] = useState(false);

  const status: ConnectionStatus =
    isConnected ? "connected" : isConnecting || isReconnecting ? "connecting" : "disconnected";

  const quickConnector =
    connectors.find((c) => c.ready) ??
    connectors.find((c) => c.id === "injected") ??
    connectors[0];

  async function handleOneClickConnect() {
    if (!quickConnector) {
      setDialogOpen(true);
      return;
    }

    setIsQuickConnecting(true);
    try {
      const result = await connectAsync({ connector: quickConnector });

      if (result.chainId !== defaultChain.id && defaultChain.id === 11155111) {
        await addAndSwitchToSepolia();
      }

      await signIn();
      setDialogOpen(false);
    } catch (err) {
      console.error("[wallet] quick connect failed:", err);
      setDialogOpen(true);
    } finally {
      setIsQuickConnecting(false);
    }
  }

  if (isConnected) {
    return <WalletDetails status={status} />;
  }

  const connecting = status === "connecting" || isQuickConnecting || isConnectPending;

  return (
    <>
      {/* Compact icon-only on small screens, full label on sm+ */}
      <Button
        size="icon"
        variant="outline"
        onClick={handleOneClickConnect}
        className="sm:hidden size-8"
        aria-label="Connect wallet"
        disabled={connecting}
      >
        <WalletIcon status={status} className="size-4" />
      </Button>
      <Button
        size="sm"
        onClick={handleOneClickConnect}
        className="hidden items-center gap-2 rounded-md border border-primary/40 bg-transparent px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/5 sm:inline-flex"
        disabled={connecting}
      >
        <WalletIcon status={status} className="size-3.5 text-primary" />
        {connecting ? "Connecting…" : "Connect"}
      </Button>
      <ConnectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
