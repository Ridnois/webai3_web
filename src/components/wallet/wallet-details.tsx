"use client";

import { useDisconnect, useSwitchChain, useAccount } from "wagmi";
import { base } from "viem/chains";
import { ChevronDown, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { getUsdcConfig } from "@/lib/contracts";

export function WalletDetails() {
  const { address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { nativeFormatted, nativeSymbol, usdcFormatted, isLoading } =
    useWalletBalances(address, chain?.id);

  const isSupported = chain ? Boolean(getUsdcConfig(chain.id)) : false;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

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
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Unsupported</Badge>
              <Button
                variant="link"
                size="xs"
                onClick={() => switchChain({ chainId: base.id })}
              >
                Switch to Base
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Address</p>
          <p className="font-mono text-sm">{displayAddress}</p>
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
