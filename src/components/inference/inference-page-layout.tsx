"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  AudioLines,
  ImagePlus,
  Loader2,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const activeFields =
    modelSchema.data && modelSchema.data.length > 0
      ? modelSchema.data
      : config.fields;

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
  const [estimatedCostFromServer, setEstimatedCostFromServer] = useState<
    number | null
  >(null);
  const inference = useInference();
  const requestMutation = inference.request;
  const submitMutation = inference.submit;
  const { isConnected, isAuthenticated, isSigningIn, signIn } = useAuth();
  const pendingInput = useRef<Record<string, unknown> | null>(null);
  const shouldAutoRequestAfterSignIn = useRef(false);
  const paymentRequirementsRef = useRef<string | null>(null);
  const { address, chainId } = useAccount();
  const { usdcFormatted, usdcRaw } = useWalletBalances(address, chainId);
  const costEstimate = useCostEstimate(task);
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

  useEffect(() => {
    if (requestError && requestError !== lastToastedErrorRef.current) {
      lastToastedErrorRef.current = requestError;
      toastInferenceError(requestError, "Request failed");
    }
  }, [requestError]);

  useEffect(() => {
    if (isConnected && !isAuthenticated && !isSigningIn && pendingInput.current) {
      signIn();
    }
  }, [isConnected, isAuthenticated, isSigningIn, signIn]);

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

    if (!isConnected) {
      pendingInput.current = input;
      shouldAutoRequestAfterSignIn.current = true;
      setConnectDialogOpen(true);
      return;
    }

    if (!isAuthenticated) {
      pendingInput.current = input;
      shouldAutoRequestAfterSignIn.current = true;
      signIn();
      return;
    }

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

  const result = submitMutation.data?.response;
  const workflowSteps = [
    {
      label: "Connect",
      active: !isConnected,
      complete: isConnected,
    },
    {
      label: "Authenticate",
      active: isConnected && !isAuthenticated,
      complete: isAuthenticated,
    },
    {
      label: "Authorize",
      active: paymentDialogOpen || x402Payment.status === "signing",
      complete:
        x402Payment.status === "signed" ||
        submitMutation.isPending ||
        Boolean(result),
    },
    {
      label: "Run",
      active: submitMutation.isPending,
      complete: Boolean(result),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-border/70 bg-background/72 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-chart-2/15 text-primary shadow-sm">
              <Icon className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-[-0.04em]">
                  {config.label}
                </h1>
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-background/75 px-3 py-1"
                >
                  {config.outputType}
                </Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {workflowSteps.map((step) => (
              <div
                key={step.label}
                className={[
                  "rounded-2xl border px-3 py-3 text-left transition-colors",
                  step.complete
                    ? "border-primary/30 bg-primary/10"
                    : step.active
                      ? "border-chart-2/35 bg-chart-2/10"
                      : "border-border/70 bg-background/70",
                ].join(" ")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Step
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-6">
          <Card className="rounded-[1.8rem] border-border/70 bg-background/72 shadow-[0_20px_65px_-46px_rgba(15,23,42,0.45)] backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
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

          <Card className="rounded-[1.8rem] border-border/70 bg-background/72 shadow-[0_20px_65px_-46px_rgba(15,23,42,0.45)] backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                2. Configure &amp; Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              {modelSchema.isLoading && selectedModel ? (
                <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/75 px-4 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading model parameters…
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <InferenceForm
                    key={
                      selectedModel
                        ? `${selectedModel.owner}/${selectedModel.name}`
                        : "none"
                    }
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
                  <CostEstimate task={task} usdcBalance={usdcFormatted} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <Card className="min-h-[420px] rounded-[1.8rem] border-border/70 bg-background/72 shadow-[0_20px_65px_-46px_rgba(15,23,42,0.45)] backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
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
                <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  {submitError.message}
                </div>
              )}

              {!result && !submitMutation.isPending && !submitError && (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-primary/14 via-primary/8 to-chart-2/12">
                    <Sparkles className="size-6 text-primary/70" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      Your next run appears here
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground/75">
                      Choose a model, configure the prompt, approve payment, and
                      this panel will switch into your live result surface.
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
