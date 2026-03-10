"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { useModelSchema } from "@/hooks/use-model-schema";
import { TASK_CONFIGS } from "@/types/task-config";
import type { TaskType, ReplicateModel } from "@/types/inference";
import { toInferenceApiError } from "@/lib/inference-error";
import { formatUsdc, usdcToOnChainAmount } from "@/lib/pricing";
import { toastInferenceError, toastInsufficientFunds } from "@/lib/toast";
import {
  ImagePlus,
  Loader2,
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
  const searchParams = useSearchParams();

  const Icon = ICON_MAP[config.icon] ?? MessageSquareText;
  const [selectedModel, setSelectedModel] = useState<ReplicateModel | null>(
    null
  );
  const modelSchema = useModelSchema(selectedModel);
  // Use dynamic schema fields when available, fall back to static config
  const activeFields =
    modelSchema.data && modelSchema.data.length > 0
      ? modelSchema.data
      : config.fields;

  // Read initial values from URL params (used by prompt templates)
  const initialValues = useMemo(() => {
    const vals: Record<string, string | number> = {};
    for (const field of activeFields) {
      const param = searchParams.get(field.name);
      if (param !== null) {
        vals[field.name] = field.type === "number" ? Number(param) : param;
      }
    }
    return Object.keys(vals).length > 0 ? vals : undefined;
  }, [searchParams, activeFields]);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [estimatedCostFromServer, setEstimatedCostFromServer] = useState<number | null>(null);
  const inference = useInference();
  const requestMutation = inference.request;
  const submitMutation = inference.submit;
  const { isConnected, isAuthenticated, isSigningIn, signIn } = useAuth();
  const pendingInput = useRef<Record<string, unknown> | null>(null);
  const shouldAutoRequestAfterSignIn = useRef(false);
  const paymentRequirementsRef = useRef<string | null>(null);
  const { address, chainId } = useAccount();
  const { usdcFormatted, usdcRaw } = useWalletBalances(address, chainId);
  const selectedModelId = selectedModel
    ? `${selectedModel.owner}/${selectedModel.name}`
    : undefined;
  const costEstimate = useCostEstimate(task, selectedModelId);
  const x402Payment = useX402Payment();
  const estimatedCostUsdc =
    estimatedCostFromServer ?? costEstimate.data?.estimatedCostUsdc ?? null;
  const estimatedCostOnChain =
    estimatedCostUsdc != null ? usdcToOnChainAmount(estimatedCostUsdc) : null;
  const insufficientFunds =
    usdcRaw !== undefined &&
    estimatedCostOnChain !== null &&
    usdcRaw < estimatedCostOnChain;

  const resetPaymentFlow = useCallback(() => {
    setPaymentDialogOpen(false);
    x402Payment.reset();
    pendingInput.current = null;
    shouldAutoRequestAfterSignIn.current = false;
    paymentRequirementsRef.current = null;
    setEstimatedCostFromServer(null);
  }, [x402Payment]);

  const startRequestPhase = useCallback(
    (input: Record<string, unknown>) => {
      if (!selectedModel) return;
      requestMutation.mutate(
        {
          model: `${selectedModel.owner}/${selectedModel.name}`,
          task,
          input,
        },
        {
          onSuccess: (data) => {
            if (data.phase !== "payment-required") return;
            paymentRequirementsRef.current = data.paymentRequirementsBase64;
            setEstimatedCostFromServer(data.estimatedCostUsdc);
            setPaymentDialogOpen(true);
          },
          onError: () => {
            pendingInput.current = null;
            shouldAutoRequestAfterSignIn.current = false;
          },
        }
      );
    },
    [requestMutation, selectedModel, task]
  );

  const startSubmitPhase = useCallback(
    (input: Record<string, unknown>, paymentSignatureBase64: string) => {
      if (!selectedModel) return;
      submitMutation.mutate(
        {
          model: `${selectedModel.owner}/${selectedModel.name}`,
          task,
          input,
          paymentSignatureBase64,
        },
        {
          onSuccess: resetPaymentFlow,
          onError: resetPaymentFlow,
        }
      );
    },
    [submitMutation, selectedModel, task, resetPaymentFlow]
  );

  const submitError = submitMutation.error;
  const requestError = requestMutation.error;
  const lastToastedErrorRef = useRef<Error | null>(null);

  // Show toast when submit fails (once per unique error)
  useEffect(() => {
    if (submitError && submitError !== lastToastedErrorRef.current) {
      lastToastedErrorRef.current = submitError;
      const parsed = toInferenceApiError(submitError);
      const isAuth =
        parsed?.status === 401 ||
        submitError.message.includes("401") ||
        submitError.message.toLowerCase().includes("unauthorized");

      toastInferenceError(
        submitError,
        isAuth ? "Authentication required" : "Inference failed"
      );
    }
  }, [submitError]);

  // Show toast when request fails (once per unique error)
  useEffect(() => {
    if (requestError && requestError !== lastToastedErrorRef.current) {
      lastToastedErrorRef.current = requestError;
      toastInferenceError(requestError, "Request failed");
    }
  }, [requestError]);

  // After wallet connects, auto-sign-in if there's a pending inference
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isSigningIn && pendingInput.current) {
      signIn();
    }
  }, [isConnected, isAuthenticated, isSigningIn, signIn]);

  // After sign-in completes, fire the request phase if pending
  useEffect(() => {
    if (
      shouldAutoRequestAfterSignIn.current &&
      isAuthenticated &&
      pendingInput.current &&
      selectedModel &&
      !requestMutation.isPending
    ) {
      shouldAutoRequestAfterSignIn.current = false;
      startRequestPhase(pendingInput.current);
    }
  }, [isAuthenticated, selectedModel, requestMutation.isPending, startRequestPhase]);

  // When payment is signed, submit with the signed header
  useEffect(() => {
    if (
      x402Payment.status === "signed" &&
      x402Payment.paymentHeader &&
      pendingInput.current &&
      selectedModel &&
      !submitMutation.isPending
    ) {
      startSubmitPhase(pendingInput.current, x402Payment.paymentHeader);
    }
  }, [x402Payment.status, x402Payment.paymentHeader, selectedModel, submitMutation.isPending, startSubmitPhase]);

  function handleSubmit(input: Record<string, unknown>) {
    if (!selectedModel) return;

    if (insufficientFunds && estimatedCostUsdc != null) {
      toastInsufficientFunds(formatUsdc(estimatedCostUsdc), usdcFormatted);
      return;
    }

    // Not connected -> open wallet connect dialog
    if (!isConnected) {
      pendingInput.current = input;
      shouldAutoRequestAfterSignIn.current = true;
      setConnectDialogOpen(true);
      return;
    }

    // Connected but not signed in -> trigger SIWE sign-in
    if (!isAuthenticated) {
      pendingInput.current = input;
      shouldAutoRequestAfterSignIn.current = true;
      signIn();
      return;
    }

    // Authenticated -> fire request phase (will get 402)
    pendingInput.current = input;
    startRequestPhase(input);
  }

  function handlePaymentConfirm() {
    if (!paymentRequirementsRef.current) return;
    if (insufficientFunds && estimatedCostUsdc != null) {
      toastInsufficientFunds(formatUsdc(estimatedCostUsdc), usdcFormatted);
      return;
    }
    x402Payment.signPayment(paymentRequirementsRef.current);
  }

  function handlePaymentDialogOpenChange(open: boolean) {
    setPaymentDialogOpen(open);
    if (!open) {
      pendingInput.current = null;
      shouldAutoRequestAfterSignIn.current = false;
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
    requestMutation.isPending ||
    submitMutation.isPending ||
    isSigningIn ||
    x402Payment.status === "signing";

  const loadingLabel = isSigningIn
    ? "Signing in..."
    : requestMutation.isPending
      ? "Requesting..."
      : x402Payment.status === "signing"
        ? "Sign in wallet..."
        : submitMutation.isPending
          ? "Running..."
          : "Processing...";

  // Use the submit result for display
  const result = submitMutation.data?.response;

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
              {modelSchema.isLoading && selectedModel ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading model parameters…
                </div>
              ) : (
              <div className="flex flex-col gap-4">
                <InferenceForm
                  key={selectedModel ? `${selectedModel.owner}/${selectedModel.name}` : "none"}
                  fields={activeFields}
                  selectedModel={selectedModel}
                  isLoading={isLoading}
                  isSubmitDisabled={insufficientFunds}
                  onSubmit={handleSubmit}
                  submitLabel={submitLabel}
                  loadingLabel={loadingLabel}
                  initialValues={initialValues}
                  helperText={
                    insufficientFunds && estimatedCostUsdc != null
                      ? `Insufficient USDC: requires ${formatUsdc(estimatedCostUsdc)}`
                      : undefined
                  }
                />
                <CostEstimate task={task} model={selectedModelId} usdcBalance={usdcFormatted} />
              </div>
              )}
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
              {submitMutation.isPending && <InferenceLoading />}

              {result && !submitMutation.isPending && (
                <InferenceResult
                  response={result}
                  outputType={config.outputType}
                />
              )}

              {submitError && !submitMutation.isPending && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  {submitError.message}
                </div>
              )}

              {!result && !submitMutation.isPending && !submitError && (
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
        estimatedCostUsdc={estimatedCostUsdc ?? 0}
        usdcBalance={usdcFormatted}
        insufficientFunds={insufficientFunds}
        paymentStatus={x402Payment.status}
        paymentError={x402Payment.error}
        inferenceRunning={submitMutation.isPending}
        onConfirm={handlePaymentConfirm}
        onRetry={handlePaymentRetry}
      />
    </div>
  );
}
