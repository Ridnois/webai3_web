"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatUsdc } from "@/lib/pricing";
import type { PaymentStatus } from "@/hooks/use-x402-payment";
import type { InferencePhase } from "@/hooks/use-inference";
import { CheckCircle2, Loader2, Shield } from "lucide-react";

interface PaymentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimatedCostUsdc: number;
  usdcBalance: string | undefined;
  insufficientFunds: boolean;
  paymentStatus: PaymentStatus;
  paymentError: Error | null;
  inferencePhase: InferencePhase;
  onConfirm: () => void;
  onRetry: () => void;
}

function PhaseStatus({ paymentStatus, inferencePhase }: {
  paymentStatus: PaymentStatus;
  inferencePhase: InferencePhase;
}) {
  if (paymentStatus === "signing") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Sign in wallet… (no gas required)
      </div>
    );
  }

  if (inferencePhase === "verifying") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Verifying payment…
      </div>
    );
  }

  if (inferencePhase === "settling") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" />
          Payment verified
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Confirming on-chain…
        </div>
      </div>
    );
  }

  return null;
}

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  estimatedCostUsdc,
  usdcBalance,
  insufficientFunds,
  paymentStatus,
  paymentError,
  inferencePhase,
  onConfirm,
  onRetry,
}: PaymentConfirmDialogProps) {
  const isProcessing =
    paymentStatus === "signing" ||
    inferencePhase === "verifying" ||
    inferencePhase === "settling";

  return (
    <Dialog open={open} onOpenChange={isProcessing ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Approve Run</DialogTitle>
          <DialogDescription>
            Gasless USDC authorization — no gas fees, funds transfer on settlement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* No gas fees badge */}
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/8 border border-emerald-500/15 px-3 py-1.5">
            <Shield className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Gasless — EIP-3009 authorization
            </span>
          </div>

          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimated cost</span>
              <span className="font-semibold font-mono">{formatUsdc(estimatedCostUsdc)} USDC</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Your balance</span>
              <span className={insufficientFunds ? "font-semibold font-mono text-destructive" : "font-semibold font-mono"}>
                {usdcBalance !== undefined ? `$${usdcBalance}` : "\u2014"}
              </span>
            </div>
            {!insufficientFunds && usdcBalance !== undefined && estimatedCostUsdc > 0 && (
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-dashed">
                <span className="text-muted-foreground text-xs">Balance after</span>
                <span className="font-mono text-xs text-muted-foreground">
                  ${(parseFloat(usdcBalance) - estimatedCostUsdc).toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {isProcessing && (
            <PhaseStatus paymentStatus={paymentStatus} inferencePhase={inferencePhase} />
          )}

          {paymentStatus === "error" && paymentError && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              {paymentError.message}
            </div>
          )}
        </div>

        <DialogFooter>
          {paymentStatus === "error" ? (
            <Button onClick={onRetry} className="w-full sm:w-auto">
              Retry
            </Button>
          ) : (
            <Button
              onClick={onConfirm}
              disabled={insufficientFunds || isProcessing || paymentStatus === "signed"}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                `Approve & Run ${formatUsdc(estimatedCostUsdc)} USDC`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
