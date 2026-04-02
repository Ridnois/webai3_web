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
  Search,
  Gauge,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// ── Model picker dialog ──────────────────────────────────────────────────────

function tierFor(model: ReplicateModel): "pro" | "fast" | "balanced" {
  if ((model.runCount ?? 0) > 5_000) return "pro";
  if ((model.runCount ?? 0) > 1_000) return "fast";
  return "balanced";
}

function formatRunCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function ModelPickerDialog({
  open,
  onOpenChange,
  models,
  isLoading,
  selectedModel,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  models: ReplicateModel[] | undefined;
  isLoading: boolean;
  selectedModel: ReplicateModel | null;
  onSelect: (model: ReplicateModel) => void;
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const filtered = models?.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.owner.toLowerCase().includes(q) ||
      (m.description?.toLowerCase().includes(q) ?? false)
    );
  });

  // Split into featured (top 3 by runs) and rest
  const sorted = filtered
    ? [...filtered].sort((a, b) => (b.runCount ?? 0) - (a.runCount ?? 0))
    : [];
  const featured = sorted.slice(0, Math.min(3, sorted.length));
  const others = sorted.slice(featured.length);

  function handleSelect(model: ReplicateModel) {
    onSelect(model);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-0 px-5 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">Choose a model</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pick the AI model to run your prompt
          </DialogDescription>
          <div className="relative pt-3 pb-3">
            <Search className="absolute left-3 top-1/2 size-4 translate-y-[-20%] text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search models…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 pl-10 pr-4 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground/50">
              {search ? `No models match "${search}"` : "No models available"}
            </p>
          ) : (
            <div className="space-y-1">
              {/* Featured models */}
              {featured.length > 0 && !search && (
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                  Top picks
                </p>
              )}
              {(!search ? featured : []).map((m) => {
                const isActive =
                  m.owner === selectedModel?.owner && m.name === selectedModel?.name;
                return (
                  <button
                    key={`${m.owner}/${m.name}`}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className={cn(
                      "flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-primary/8",
                      isActive && "bg-primary/10 ring-1 ring-primary/25"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono text-sm font-semibold",
                          isActive && "text-primary"
                        )}>
                          {m.name}
                        </span>
                        <ModelTierPill tier={tierFor(m)} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/50">{m.owner}</p>
                      {m.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {m.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                      <span className="flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground/40">
                        <Gauge className="size-3" />
                        {formatRunCount(m.runCount)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Rest of models */}
              {others.length > 0 && !search && (
                <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  More models
                </p>
              )}
              {(search ? sorted : others).map((m) => {
                const isActive =
                  m.owner === selectedModel?.owner && m.name === selectedModel?.name;
                return (
                  <button
                    key={`${m.owner}/${m.name}`}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className={cn(
                      "flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60",
                      isActive && "bg-primary/8 ring-1 ring-primary/20"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono text-sm font-semibold",
                          isActive && "text-primary"
                        )}>
                          {m.name}
                        </span>
                        <ModelTierPill tier={tierFor(m)} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/50">{m.owner}</p>
                      {m.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {m.description}
                        </p>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 pt-0.5 text-[10px] tabular-nums text-muted-foreground/40">
                      <Gauge className="size-3" />
                      {formatRunCount(m.runCount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  const [modelDialogOpen, setModelDialogOpen] = useState(false);

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

  // ── Tab indicator measurement ────────────────────────────────────────────
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[task];
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicatorStyle({
      left: elRect.left - parentRect.left,
      width: elRect.width,
    });
  }, [task]);

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
              ref={(el) => { tabRefs.current[id] = el; }}
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
              left: indicatorStyle.left,
              width: indicatorStyle.width,
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
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setModelDialogOpen(true)}
              className="flex min-w-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary/40 hover:bg-primary/10"
            >
              <ChevronDown className="size-3 shrink-0" />
              <span className="truncate font-mono text-[11px]">
                {selectedModel?.name ?? "Select model"}
              </span>
              {selectedModel && (
                <ModelTierPill tier={tierFor(selectedModel)} />
              )}
            </button>
            {costEstimate.data && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1">
                <span className="font-mono text-[11px] font-semibold text-primary">
                  {formatUsdc(costEstimate.data.estimatedCostUsdc)}
                </span>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">est.</span>
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

      <ModelPickerDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        models={models}
        isLoading={!models}
        selectedModel={selectedModel}
        onSelect={setSelectedModel}
      />
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
