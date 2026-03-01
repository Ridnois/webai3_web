"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModelSelector } from "./model-selector";
import { InferenceForm } from "./inference-form";
import { InferenceResult } from "./inference-result";
import { InferenceLoading } from "./inference-loading";
import { CostEstimate } from "./cost-estimate";
import { PaymentConfirmDialog } from "./payment-confirm-dialog";
import { ConnectDialog } from "@/components/wallet/connect-dialog";
import { useInference } from "@/hooks/use-inference";
import { useAuth } from "@/hooks/use-auth";
import { useCostEstimate } from "@/hooks/use-cost-estimate";
import { useUsdcPayment } from "@/hooks/use-usdc-payment";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { env } from "@/lib/env";
import { TASK_CONFIGS } from "@/types/task-config";
import type { TaskType, ReplicateModel } from "@/types/inference";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, typeof ImagePlus> = {
  ImagePlus,
  MessageSquareText,
  AudioLines,
};

interface InferencePageLayoutProps {
  task: TaskType;
}

export function InferencePageLayout({ task }: InferencePageLayoutProps) {
  const config = TASK_CONFIGS[task];
  const Icon = ICON_MAP[config.icon] ?? MessageSquareText;
  const [selectedModel, setSelectedModel] = useState<ReplicateModel | null>(
    null
  );
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const inference = useInference();
  const { isConnected, isAuthenticated, isSigningIn, signIn } = useAuth();
  const pendingInput = useRef<Record<string, unknown> | null>(null);
  const inferenceTriggeredRef = useRef(false);
  const { address, chainId } = useAccount();
  const { usdcFormatted } = useWalletBalances(address, chainId);
  const costEstimate = useCostEstimate(task);
  const receiverAddress = env.NEXT_PUBLIC_RECEIVER_ADDRESS ?? "";
  const payment = useUsdcPayment(receiverAddress);

  // Show toast when inference fails
  useEffect(() => {
    if (inference.error) {
      const msg = inference.error.message;
      const isAuth = msg.includes("401") || msg.toLowerCase().includes("unauthorized");
      toast.error(isAuth ? "Authentication required" : "Inference failed", {
        description: isAuth
          ? "Your session expired — please sign in again."
          : msg,
      });
    }
  }, [inference.error]);

  // After wallet connects, auto-sign-in if there's a pending inference
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isSigningIn && pendingInput.current) {
      signIn();
    }
  }, [isConnected, isAuthenticated, isSigningIn, signIn]);

  // After sign-in completes, open payment dialog if there's a pending inference
  useEffect(() => {
    if (isAuthenticated && pendingInput.current && selectedModel && !paymentDialogOpen) {
      setPaymentDialogOpen(true);
    }
  }, [isAuthenticated, selectedModel, paymentDialogOpen]);

  // When payment is confirmed, fire the inference with payment data
  useEffect(() => {
    if (
      payment.status === "confirmed" &&
      pendingInput.current &&
      selectedModel &&
      costEstimate.data &&
      !inference.isPending
    ) {
      inferenceTriggeredRef.current = true;
      inference.mutate({
        model: `${selectedModel.owner}/${selectedModel.name}`,
        task,
        input: pendingInput.current,
        payment: {
          txHash: payment.txHash!,
          chainId: payment.chainId,
          estimatedCostUsdc: costEstimate.data.estimatedCostUsdc,
        },
      });
      pendingInput.current = null;
    }
  }, [payment.status, payment.txHash, payment.chainId, selectedModel, task, costEstimate.data, inference.isPending, inference.mutate]);

  // Close dialog and reset payment when inference completes
  useEffect(() => {
    if (inferenceTriggeredRef.current && inference.data && !inference.isPending) {
      setPaymentDialogOpen(false);
      payment.reset();
      inferenceTriggeredRef.current = false;
    }
  }, [inference.data, inference.isPending, payment.reset]);

  function handleSubmit(input: Record<string, unknown>) {
    if (!selectedModel) return;

    // Not connected → open wallet connect dialog
    if (!isConnected) {
      pendingInput.current = input;
      setConnectDialogOpen(true);
      return;
    }

    // Connected but not signed in → trigger SIWE sign-in
    if (!isAuthenticated) {
      pendingInput.current = input;
      signIn();
      return;
    }

    // Authenticated → open payment dialog
    pendingInput.current = input;
    setPaymentDialogOpen(true);
  }

  function handlePaymentConfirm() {
    if (!costEstimate.data) return;
    payment.sendPayment(costEstimate.data.estimatedCostUsdc);
  }

  function handlePaymentDialogOpenChange(open: boolean) {
    setPaymentDialogOpen(open);
    if (!open) {
      pendingInput.current = null;
      payment.reset();
    }
  }

  function handlePaymentRetry() {
    payment.reset();
  }

  const submitLabel = !isConnected
    ? "Connect Wallet to Run"
    : !isAuthenticated
      ? "Sign in to Run"
      : undefined;

  const loadingLabel = isSigningIn
    ? "Signing in..."
    : payment.status === "approving"
      ? "Approve in wallet..."
      : payment.status === "confirming"
        ? "Confirming payment..."
        : "Running...";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {config.label}
            </h1>
            <Badge variant="outline">{config.outputType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left: controls */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                1. Choose a Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModelSelector
                task={task}
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                2. Configure &amp; Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <InferenceForm
                  fields={config.fields}
                  selectedModel={selectedModel}
                  isLoading={inference.isPending || isSigningIn || payment.status === "approving" || payment.status === "confirming"}
                  onSubmit={handleSubmit}
                  submitLabel={submitLabel}
                  loadingLabel={loadingLabel}
                />
                <CostEstimate task={task} usdcBalance={usdcFormatted} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: result (sticky on desktop) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="min-h-[320px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inference.isPending && <InferenceLoading />}

              {inference.data && !inference.isPending && (
                <InferenceResult
                  response={inference.data}
                  outputType={config.outputType}
                />
              )}

              {inference.error && !inference.isPending && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  {inference.error.message}
                </div>
              )}

              {!inference.data && !inference.isPending && !inference.error && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="size-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No results yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/75">
                      Select a model and submit your input to see results
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
      />
      {costEstimate.data && (
        <PaymentConfirmDialog
          open={paymentDialogOpen}
          onOpenChange={handlePaymentDialogOpenChange}
          estimatedCostUsdc={costEstimate.data.estimatedCostUsdc}
          usdcBalance={usdcFormatted}
          paymentStatus={payment.status}
          paymentError={payment.error}
          inferenceRunning={inference.isPending}
          onConfirm={handlePaymentConfirm}
          onRetry={handlePaymentRetry}
        />
      )}
    </div>
  );
}
