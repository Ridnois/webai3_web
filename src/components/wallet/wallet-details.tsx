"use client";

import { useState } from "react";
import { useDisconnect, useSwitchChain, useAccount } from "wagmi";
import { ChevronDown, Wallet, LogOut, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { getUsdcConfig } from "@/lib/contracts";
import { defaultChain } from "@/lib/wagmi";

export function WalletDetails() {
  const { address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { nativeFormatted, nativeSymbol, usdcFormatted, isLoading } =
    useWalletBalances(address, chain?.id);

  const [copied, setCopied] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const isSupported = chain ? Boolean(getUsdcConfig(chain.id)) : false;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSwitchChain() {
    setSwitchError(null);
    try {
      // Use wallet_addEthereumChain as fallback for mobile wallets
      if (defaultChain.id === 11155111) {
        const { addAndSwitchToSepolia } = await import("@/lib/wallet-network");
        await addAndSwitchToSepolia();
      } else {
        switchChain({ chainId: defaultChain.id });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to switch network";
      setSwitchError(errorMsg);
      console.error("Network switch failed:", error);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Wallet menu"
        >
          <Wallet className="size-4" />
          <span className="hidden sm:inline">{displayAddress}</span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Network</p>
          {isSupported && chain ? (
            <Badge variant="secondary">{chain.name}</Badge>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Unsupported</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isSwitching}
                onClick={handleSwitchChain}
              >
                {isSwitching ? "Switching..." : `Switch to ${defaultChain.name}`}
              </Button>
              {switchError && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-2 flex gap-2 text-xs text-amber-900 dark:text-amber-100">
                  <AlertCircle className="size-3 mt-0.5 flex-shrink-0" />
                  <p>
                    Unable to auto-switch. Please manually switch to {defaultChain.name} in your wallet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Address</p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-sm">{displayAddress}</p>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Copy address"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Balances</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-0.5 text-sm">
              {nativeFormatted && (
                <p>
                  {nativeFormatted} {nativeSymbol}
                </p>
              )}
              {usdcFormatted && <p>{usdcFormatted} USDC</p>}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => disconnect()}
        >
          <LogOut className="size-4" />
          Disconnect
        </Button>
      </PopoverContent>
    </Popover>
  );
}
