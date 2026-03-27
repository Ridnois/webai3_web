"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowUp,
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ChevronDown,
  Loader2,
  Sparkles,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModels } from "@/hooks/use-models";
import { useInference } from "@/hooks/use-inference";
import { useCostEstimate } from "@/hooks/use-cost-estimate";
import { useX402Payment } from "@/hooks/use-x402-payment";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { InferenceResult } from "@/components/inference/inference-result";
import { PaymentConfirmDialog } from "@/components/inference/payment-confirm-dialog";
import { ConnectDialog } from "@/components/wallet/connect-dialog";
import { TASK_CONFIGS } from "@/types/task-config";
import { toInferenceApiError } from "@/lib/inference-error";
import { formatUsdc, usdcToOnChainAmount } from "@/lib/pricing";
import { toastInferenceError, toastInsufficientFunds } from "@/lib/toast";
import type { TaskType, ReplicateModel } from "@/types/inference";
import { ModelTierPill } from "@/components/sections/model-tier-pill";
import { useFreeCreditStatus } from "@/hooks/use-free-credit-status";
import { useAuth } from "@/hooks/use-auth";

const DEFAULT_MODEL_IDS: Record<TaskType, string> = {
  "text-to-image": "black-forest-labs/flux-schnell",
  "text-to-text": "meta/meta-llama-3-70b-instruct",
  "text-to-sound": "minimax/music-1.5",
};

const TASKS = [
  { id: "text-to-image" as TaskType, label: "Image", icon: ImagePlus },
  { id: "text-to-text" as TaskType, label: "Text", icon: MessageSquareText },
  { id: "text-to-sound" as TaskType, label: "Audio", icon: AudioLines },
] as const;

const PLACEHOLDERS: Record<TaskType, string> = {
  "text-to-image": "Describe what you want to generate…",
  "text-to-text": "Ask anything or give a task…",
  "text-to-sound": "Describe the sound or music you want…",
};

type Suggestion = { label: string; task: TaskType; prompt: string };

const SUGGESTIONS: Suggestion[] = [
  {
    label: "Futuristic city at night",
    task: "text-to-image",
    prompt:
      "A photorealistic aerial view of a futuristic city at night, glowing neon lights, rain-slicked streets, cinematic composition",
  },
  {
    label: "Explain blockchain simply",
    task: "text-to-text",
    prompt:
      "Explain how a blockchain works to someone with no technical background. Use a simple analogy.",
  },
  {
    label: "Ambient study music",
    task: "text-to-sound",
    prompt:
      "A calm, looping ambient piano piece suitable for studying. Slow tempo, no percussion, reverb-heavy.",
  },
  {
    label: "Cyberpunk portrait",
    task: "text-to-image",
    prompt:
      "Portrait of a cyberpunk hacker, neon-lit alley background, rain, dramatic lighting, photorealistic, 8k",
  },
];

function parseTaskParam(value: string | null): TaskType | null {
  if (value === "text-to-image") return value;
  if (value === "text-to-text") return value;
  if (value === "text-to-sound") return value;
  return null;
}

// ── Compact model dropdown ────────────────────────────────────────────────────

function CompactModelDropdown({
  task,
  selectedModel,
  onSelect,
}: {
  task: TaskType;
  selectedModel: ReplicateModel | null;
  onSelect: (model: ReplicateModel) => void;
}) {
  const { data: models, isLoading } = useModels(task);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<ReplicateModel | null>(null);

  const displayName = selectedModel?.name ?? "Select model";

  function groupedModels() {
    if (!models || models.length === 0) return { featured: [], others: [] };
    const sorted = [...models].sort((a, b) => (b.runCount ?? 0) - (a.runCount ?? 0));
    const featured = sorted.slice(0, Math.min(3, sorted.length));
    const others = sorted.slice(featured.length);
    return { featured, others };
  }

  function tierFor(model: ReplicateModel): "pro" | "fast" | "balanced" {
    if ((model.runCount ?? 0) > 5_000) return "pro";
    if ((model.runCount ?? 0) > 1_000) return "fast";
    return "balanced";
  }

  const { featured, others } = groupedModels();
  const preview = hovered ?? selectedModel ?? featured[0] ?? others[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading || !models?.length}
        className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary/40 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        )}
        <span className="max-w-[140px] truncate font-mono text-[11px]">
          {displayName}
        </span>
      </button>

      {open && models && models.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-2 w-[420px] overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl shadow-black/20">
            <div className="grid grid-cols-5">
              <div className="col-span-3 max-h-72 overflow-y-auto divide-y divide-border/60">
                {featured.length > 0 && (
                  <div className="bg-primary/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                    Top picks
                  </div>
                )}
                {featured.map((m) => {
                  const isActive =
                    m.owner === selectedModel?.owner &&
                    m.name === selectedModel?.name;
                  return (
                    <button
                      key={`${m.owner}/${m.name}-featured`}
                      type="button"
                      onMouseEnter={() => setHovered(m)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => {
                        onSelect(m);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-xs transition-colors hover:bg-primary/10",
                        isActive && "bg-primary/15 text-primary"
                      )}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="font-mono text-[11px]">{m.name}</span>
                        <ModelTierPill tier={tierFor(m)} />
                      </span>
                      {m.description && (
                        <span className="line-clamp-1 text-muted-foreground/70">
                          {m.description}
                        </span>
                      )}
                    </button>
                  );
                })}

                {others.length > 0 && (
                  <div className="bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    More models
                  </div>
                )}
                {others.map((m) => {
                  const isActive =
                    m.owner === selectedModel?.owner &&
                    m.name === selectedModel?.name;
                  return (
                    <button
                      key={`${m.owner}/${m.name}-other`}
                      type="button"
                      onMouseEnter={() => setHovered(m)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => {
                        onSelect(m);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/60",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <span className="font-mono text-[11px] font-medium flex items-center gap-2">
                        {m.name}
                        <ModelTierPill tier={tierFor(m)} />
                      </span>
                      {m.description && (
                        <span className="line-clamp-1 text-muted-foreground/70">
                          {m.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Preview panel */}
              <div className="col-span-2 hidden border-l border-border/60 bg-muted/50 p-3 sm:flex sm:flex-col sm:gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Preview
                </p>
                {preview ? (
                  <div className="space-y-2 rounded-lg border border-border/70 bg-background/90 p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold">{preview.name}</p>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                          {preview.owner}
                        </p>
                      </div>
                      <ModelTierPill tier={tierFor(preview)} />
                    </div>
                    {preview.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {preview.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Gauge className="size-3.5" />
                      <span>{preview.runCount?.toLocaleString() ?? "—"} runs</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 text-xs text-muted-foreground">
                    Hover to preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
}

export function HomePromptBox() {
  const searchParams = useSearchParams();
  const [task, setTask] = useState<TaskType>(
    () => parseTaskParam(searchParams.get("task")) ?? "text-to-image"
  );
  const [prompt, setPrompt] = useState(() => searchParams.get("prompt") ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedModel, setSelectedModel] = useState<ReplicateModel | null>(null);
  const { status: freeStatus, isLoading: freeLoading } = useFreeCreditStatus();
  const { isAuthenticated: isFreeAuthed } = useAuth();

  // Auto-select default model when models load or task changes
  const { data: models } = useModels(task);
  useEffect(() => {
    if (!models?.length) return;
    const defaultId = DEFAULT_MODEL_IDS[task];
    const [owner, name] = defaultId.split("/");
    const found = models.find((m) => m.owner === owner && m.name === name);
    setSelectedModel(found ?? models[0]);
  }, [models, task]);

  const config = TASK_CONFIGS[task];

  // ── Inference hooks ──────────────────────────────────────────────────────
  const inference = useInference();
  const requestMutation = inference.request;
  const submitMutation = inference.submit;
  const inferencePhase = inference.inferencePhase;
  const { isConnected, isAuthenticated, isSigningIn, signIn } = useAuth();
  const pendingInput = useRef<Record<string, unknown> | null>(null);
  const shouldAutoRequestAfterSignIn = useRef(false);
  const paymentRequirementsRef = useRef<string | null>(null);
  const [estimatedCostFromServer, setEstimatedCostFromServer] = useState<number | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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
      inference.resetResult();
      requestMutation.mutate(
        { model: `${selectedModel.owner}/${selectedModel.name}`, task, input },
        {
          onSuccess: (data) => {
            if (data.phase === "payment-required") {
              paymentRequirementsRef.current = data.paymentRequirementsBase64;
              setEstimatedCostFromServer(data.estimatedCostUsdc);
              setPaymentDialogOpen(true);
            }
            if (data.phase === "complete") {
              resetPaymentFlow();
            }
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
        { onSuccess: resetPaymentFlow, onError: resetPaymentFlow }
      );
    },
    [submitMutation, selectedModel, task, resetPaymentFlow]
  );

  // Error toasts
  const lastToastedError = useRef<Error | null>(null);
  useEffect(() => {
    const err = submitMutation.error;
    if (err && err !== lastToastedError.current) {
      lastToastedError.current = err;
      const parsed = toInferenceApiError(err);
      const isAuth =
        parsed?.status === 401 ||
        err.message.includes("401") ||
        err.message.toLowerCase().includes("unauthorized");
      toastInferenceError(err, isAuth ? "Authentication required" : "Inference failed");
    }
  }, [submitMutation.error]);

  useEffect(() => {
    const err = requestMutation.error;
    if (err && err !== lastToastedError.current) {
      lastToastedError.current = err;
      toastInferenceError(err, "Request failed");
    }
  }, [requestMutation.error]);

  // Close payment dialog once inference starts running (payment confirmed)
  useEffect(() => {
    if (inferencePhase === "running") {
      setPaymentDialogOpen(false);
    }
  }, [inferencePhase]);

  // Auto sign-in after wallet connect
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isSigningIn && pendingInput.current)
      signIn();
  }, [isConnected, isAuthenticated, isSigningIn, signIn]);

  // Auto request after sign-in
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

  // Payment signed → submit
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
  }, [
    x402Payment.status,
    x402Payment.paymentHeader,
    selectedModel,
    submitMutation.isPending,
    startSubmitPhase,
  ]);

  function handleTaskChange(t: TaskType) {
    setTask(t);
    setSelectedModel(null);
    submitMutation.reset();
    requestMutation.reset();
  }

  function handleSubmit() {
    if (!selectedModel || !prompt.trim()) return;
    const input: Record<string, unknown> = { prompt: prompt.trim() };

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

  function handlePaymentDialogChange(open: boolean) {
    setPaymentDialogOpen(open);
    if (!open) {
      pendingInput.current = null;
      shouldAutoRequestAfterSignIn.current = false;
      paymentRequirementsRef.current = null;
      setEstimatedCostFromServer(null);
      x402Payment.reset();
    }
  }

  function applySuggestion(s: Suggestion) {
    handleTaskChange(s.task);
    setPrompt(s.prompt);
  }

  const isLoading =
    requestMutation.isPending ||
    submitMutation.isPending ||
    isSigningIn ||
    x402Payment.status === "signing";

  const loadingLabel = isSigningIn
    ? "Signing in…"
    : requestMutation.isPending
    ? "Requesting…"
    : x402Payment.status === "signing"
    ? "Sign in wallet…"
    : inferencePhase === "verifying"
    ? "Verifying payment…"
    : inferencePhase === "settling"
    ? "Confirming on-chain…"
    : inferencePhase === "running"
    ? "Running inference…"
    : submitMutation.isPending
    ? "Running…"
    : "Processing…";

  const canSubmit = prompt.trim().length > 0 && !!selectedModel && !isLoading;
  const result = inference.result ?? submitMutation.data?.response;
  const showFreeBanner =
    isFreeAuthed &&
    !freeLoading &&
    freeStatus &&
    freeStatus.remainingCredit > 0;
  const freeLabel = freeStatus
    ? `${freeStatus.remainingCredit} free inference${freeStatus.remainingCredit === 1 ? "" : "s"} left`
    : "";

  return (
    <div className="w-full space-y-3">
      {/* Composer card */}
      <div className={cn(
        "glass overflow-hidden rounded-2xl transition-all duration-300",
        "shadow-[0_0_32px_-8px_oklch(0.78_0.14_65_/_25%),0_0_64px_-16px_oklch(0.72_0.18_280_/_15%)]",
        isFocused
          ? "shadow-[0_0_40px_-6px_oklch(0.78_0.14_65_/_50%),0_0_80px_-20px_oklch(0.72_0.18_280_/_30%)] prompt-box-focused"
          : "hover:shadow-[0_0_36px_-8px_oklch(0.78_0.14_65_/_35%),0_0_72px_-18px_oklch(0.72_0.18_280_/_20%)]"
      )}>
        {/* Task tabs */}
        <div className="relative flex gap-1 border-b border-black/[0.06] dark:border-white/[0.06] px-2 pt-2">
          {TASKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTaskChange(id)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-all duration-150",
                task === id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
          {/* Sliding indicator */}
          <span
            className="absolute bottom-0 h-[2px] rounded-full bg-primary transition-all duration-200 ease-out"
            style={{
              left: `${8 + TASKS.findIndex(t => t.id === task) * (100 / TASKS.length)}%`,
              width: `${100 / TASKS.length}%`,
              maxWidth: "80px",
            }}
          />
        </div>

        {/* Textarea */}
        <div className="px-4 pt-4 pb-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              autoResize(e.target);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={PLACEHOLDERS[task]}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit)
                handleSubmit();
            }}
            className="w-full resize-none bg-transparent text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none max-h-[200px]"
          />
        </div>

        {/* Footer: model selector + cost + submit */}
        <div className="flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02] px-3 py-2.5">
          <div className="flex items-center gap-3">
            <CompactModelDropdown
              task={task}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
            />
            {costEstimate.data && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1">
                  <span className="font-mono text-[11px] font-semibold text-primary">
                    {formatUsdc(costEstimate.data.estimatedCostUsdc)}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">est.</span>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "brand-cta flex items-center justify-center rounded-full transition-all duration-200 size-9 max-sm:size-11",
              canSubmit && "shadow-[0_0_12px_-2px_oklch(0.78_0.14_65_/_40%)]",
              !canSubmit && "opacity-30 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </button>
        </div>

        {showFreeBanner && (
          <div className="flex items-center gap-2 border-t border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] font-semibold text-emerald-900 dark:text-emerald-50 sm:text-xs">
            <Sparkles className="size-3 shrink-0 text-emerald-600 dark:text-emerald-200" />
            <span className="truncate">{freeLabel}</span>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {!result && !isLoading && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {SUGGESTIONS.map((s) => {
            const Icon =
              TASKS.find((t) => t.id === s.task)?.icon ?? ImagePlus;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => applySuggestion(s)}
                className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-3 py-2.5 text-left text-sm text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:text-foreground hover:bg-primary/5 sm:rounded-full sm:py-1.5 sm:px-3.5"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/8 sm:size-auto sm:rounded-none sm:bg-transparent sm:p-0">
                  <Icon className="size-3.5 text-primary/70 sm:size-3 sm:text-primary/60" />
                </span>
                <span className="leading-tight">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Result area */}
      {(isLoading || result || submitMutation.error) && (
        <div className="glass overflow-hidden rounded-2xl p-5">
          {isLoading && !result && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm font-medium">{loadingLabel}</p>
              {submitMutation.isPending && (
                <p className="text-xs text-muted-foreground">
                  Running {selectedModel?.name ?? "model"}…
                </p>
              )}
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Output
                </p>
                {result.metrics?.predictTimeMs && (
                  <p className="text-xs text-muted-foreground">
                    {(result.metrics.predictTimeMs / 1000).toFixed(1)}s
                    {result.metrics.actualCostUsdc !== undefined && (
                      <span className="ml-2">
                        {formatUsdc(result.metrics.actualCostUsdc)}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <InferenceResult
                response={result}
                outputType={config.outputType}
              />
              <button
                type="button"
                onClick={() => {
                  submitMutation.reset();
                  requestMutation.reset();
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← New generation
              </button>
            </div>
          )}

          {submitMutation.error && !isLoading && !result && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-sm text-destructive">
              {submitMutation.error.message}
            </div>
          )}
        </div>
      )}

      {/* Empty state hint when no result yet */}
      {!result && !isLoading && !submitMutation.error && (
        <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground/40">
          <Sparkles className="size-3" />
          <span>Pay per run · USDC on-chain · x402 settlement</span>
        </div>
      )}

      <ConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
      />
      <PaymentConfirmDialog
        open={paymentDialogOpen}
        onOpenChange={handlePaymentDialogChange}
        estimatedCostUsdc={estimatedCostUsdc ?? 0}
        usdcBalance={usdcFormatted}
        insufficientFunds={insufficientFunds}
        paymentStatus={x402Payment.status}
        paymentError={x402Payment.error}
        inferencePhase={inferencePhase}
        onConfirm={handlePaymentConfirm}
        onRetry={() => x402Payment.reset()}
      />
    </div>
  );
}
