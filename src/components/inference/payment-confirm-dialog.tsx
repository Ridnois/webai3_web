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
import { CheckCircle2, Loader2 } from "lucide-react";

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
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Authorize a gasless USDC transfer for this inference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimated cost</span>
              <span className="font-semibold">{formatUsdc(estimatedCostUsdc)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Your USDC balance</span>
              <span className={insufficientFunds ? "font-semibold text-destructive" : "font-semibold"}>
                {usdcBalance !== undefined ? `$${usdcBalance}` : "\u2014"}
              </span>
            </div>
          </div>

          {isProcessing && (
            <PhaseStatus paymentStatus={paymentStatus} inferencePhase={inferencePhase} />
          )}

          {paymentStatus === "error" && paymentError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                `Sign & Run ${formatUsdc(estimatedCostUsdc)}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
