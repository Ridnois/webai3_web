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
import { useX402Payment } from "@/hooks/use-x402-payment";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
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
  const [estimatedCostFromServer, setEstimatedCostFromServer] = useState<number | null>(null);
  const inference = useInference();
  const { isConnected, isAuthenticated, isSigningIn, signIn } = useAuth();
  const pendingInput = useRef<Record<string, unknown> | null>(null);
  const paymentRequirementsRef = useRef<string | null>(null);
  const { address, chainId } = useAccount();
  const { usdcFormatted } = useWalletBalances(address, chainId);
  const costEstimate = useCostEstimate(task);
  const x402Payment = useX402Payment();

  // Show toast when submit fails
  useEffect(() => {
    const err = inference.submit.error;
    if (err) {
      const msg = err.message;
      const isAuth = msg.includes("401") || msg.toLowerCase().includes("unauthorized");
      toast.error(isAuth ? "Authentication required" : "Inference failed", {
        description: isAuth
          ? "Your session expired \u2014 please sign in again."
          : msg,
      });
    }
  }, [inference.submit.error]);

  // Show toast when request fails (non-402 errors)
  useEffect(() => {
    if (inference.request.error) {
      toast.error("Request failed", {
        description: inference.request.error.message,
      });
    }
  }, [inference.request.error]);

  // After wallet connects, auto-sign-in if there's a pending inference
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isSigningIn && pendingInput.current) {
      signIn();
    }
  }, [isConnected, isAuthenticated, isSigningIn, signIn]);

  // After sign-in completes, fire the request phase if pending
  useEffect(() => {
    if (isAuthenticated && pendingInput.current && selectedModel && !inference.request.isPending) {
      inference.request.mutate({
        model: `${selectedModel.owner}/${selectedModel.name}`,
        task,
        input: pendingInput.current,
      });
    }
  }, [isAuthenticated, selectedModel, task, inference.request.isPending, inference.request.mutate]);

  // When request returns payment-required, open payment dialog
  useEffect(() => {
    if (inference.request.data?.phase === "payment-required") {
      paymentRequirementsRef.current = inference.request.data.paymentRequirementsBase64;
      setEstimatedCostFromServer(inference.request.data.estimatedCostUsdc);
      setPaymentDialogOpen(true);
    }
  }, [inference.request.data]);

  // When payment is signed, submit with the signed header
  useEffect(() => {
    if (
      x402Payment.status === "signed" &&
      x402Payment.paymentHeader &&
      pendingInput.current &&
      selectedModel &&
      !inference.submit.isPending
    ) {
      inference.submit.mutate({
        model: `${selectedModel.owner}/${selectedModel.name}`,
        task,
        input: pendingInput.current,
        paymentSignatureBase64: x402Payment.paymentHeader,
      });
    }
  }, [x402Payment.status, x402Payment.paymentHeader, selectedModel, task, inference.submit.isPending, inference.submit.mutate]);

  // Close dialog and reset when inference completes
  useEffect(() => {
    if (inference.submit.data?.phase === "complete" && !inference.submit.isPending) {
      setPaymentDialogOpen(false);
      x402Payment.reset();
      pendingInput.current = null;
      paymentRequirementsRef.current = null;
      setEstimatedCostFromServer(null);
    }
  }, [inference.submit.data, inference.submit.isPending, x402Payment.reset]);

  function handleSubmit(input: Record<string, unknown>) {
    if (!selectedModel) return;

    // Not connected -> open wallet connect dialog
    if (!isConnected) {
      pendingInput.current = input;
      setConnectDialogOpen(true);
      return;
    }

    // Connected but not signed in -> trigger SIWE sign-in
    if (!isAuthenticated) {
      pendingInput.current = input;
      signIn();
      return;
    }

    // Authenticated -> fire request phase (will get 402)
    pendingInput.current = input;
    inference.request.mutate({
      model: `${selectedModel.owner}/${selectedModel.name}`,
      task,
      input,
    });
  }

  function handlePaymentConfirm() {
    if (!paymentRequirementsRef.current) return;
    x402Payment.signPayment(paymentRequirementsRef.current);
  }

  function handlePaymentDialogOpenChange(open: boolean) {
    setPaymentDialogOpen(open);
    if (!open) {
      pendingInput.current = null;
      paymentRequirementsRef.current = null;
      setEstimatedCostFromServer(null);
      x402Payment.reset();
    }
  }

  function handlePaymentRetry() {
    x402Payment.reset();
  }

  const submitLabel = !isConnected
    ? "Connect Wallet to Run"
    : !isAuthenticated
      ? "Sign in to Run"
      : undefined;

  const isLoading =
    inference.request.isPending ||
    inference.submit.isPending ||
    isSigningIn ||
    x402Payment.status === "signing";

  const loadingLabel = isSigningIn
    ? "Signing in..."
    : inference.request.isPending
      ? "Requesting..."
      : x402Payment.status === "signing"
        ? "Sign in wallet..."
        : inference.submit.isPending
          ? "Running..."
          : "Processing...";

  // Use the submit result for display
  const result = inference.submit.data?.response;
  const submitError = inference.submit.error;

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
                  isLoading={isLoading}
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
              {inference.submit.isPending && <InferenceLoading />}

              {result && !inference.submit.isPending && (
                <InferenceResult
                  response={result}
                  outputType={config.outputType}
                />
              )}

              {submitError && !inference.submit.isPending && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  {submitError.message}
                </div>
              )}

              {!result && !inference.submit.isPending && !submitError && (
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
      <PaymentConfirmDialog
        open={paymentDialogOpen}
        onOpenChange={handlePaymentDialogOpenChange}
        estimatedCostUsdc={estimatedCostFromServer ?? costEstimate.data?.estimatedCostUsdc ?? 0}
        usdcBalance={usdcFormatted}
        paymentStatus={x402Payment.status}
        paymentError={x402Payment.error}
        inferenceRunning={inference.submit.isPending}
        onConfirm={handlePaymentConfirm}
        onRetry={handlePaymentRetry}
      />
    </div>
  );
}
