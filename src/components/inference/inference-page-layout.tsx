"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ArrowUp,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Clock,
  LayoutTemplate,
  Music,
  FileText,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InferenceResult } from "./inference-result";
import { PaymentConfirmDialog } from "./payment-confirm-dialog";
import { ConnectDialog } from "@/components/wallet/connect-dialog";
import { useInference } from "@/hooks/use-inference";
import { useAuth } from "@/hooks/use-auth";
import { useCostEstimate } from "@/hooks/use-cost-estimate";
import { useX402Payment } from "@/hooks/use-x402-payment";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { useModelSchema } from "@/hooks/use-model-schema";
import { useModels } from "@/hooks/use-models";
import { useInferenceHistory } from "@/hooks/use-inference-history";
import { getTemplatesByTask } from "@/lib/templates";
import type { PromptTemplate } from "@/lib/templates";
import { TASK_CONFIGS } from "@/types/task-config";
import type { TaskType, ReplicateModel } from "@/types/inference";
import type { InputField } from "@/types/task-config";
import { toInferenceApiError } from "@/lib/inference-error";
import { formatUsdc, usdcToOnChainAmount } from "@/lib/pricing";
import { toastInferenceError, toastInsufficientFunds } from "@/lib/toast";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MODEL_IDS: Record<TaskType, string> = {
  "text-to-image": "black-forest-labs/flux-schnell",
  "text-to-text":  "meta/meta-llama-3-70b-instruct",
  "text-to-sound": "minimax/music-1.5",
};

const TASK_NAV = [
  {
    task: "text-to-image" as TaskType,
    label: "Image",
    icon: ImagePlus,
    href: "/inference/text-to-image",
    activeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    task: "text-to-text" as TaskType,
    label: "Text",
    icon: MessageSquareText,
    href: "/inference/text-to-text",
    activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    task: "text-to-sound" as TaskType,
    label: "Audio",
    icon: AudioLines,
    href: "/inference/text-to-sound",
    activeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
] as const;

const TASK_SUGGESTIONS: Record<TaskType, { label: string; prompt: string }[]> = {
  "text-to-image": [
    { label: "Futuristic city at night", prompt: "A photorealistic aerial view of a futuristic city at night, glowing neon lights, rain-slicked streets, cinematic composition, 8k" },
    { label: "Watercolor botanical garden", prompt: "A serene botanical garden in soft watercolor style, lily pads, Japanese architecture, golden hour light" },
    { label: "Cyberpunk portrait", prompt: "Portrait of a cyberpunk hacker, neon-lit alley background, rain, dramatic lighting, photorealistic, 8k" },
  ],
  "text-to-text": [
    { label: "Explain quantum computing", prompt: "Explain quantum computing to a software engineer who has never studied physics. Use analogies from everyday programming." },
    { label: "Write a short story", prompt: "Write a 200-word noir short story set in a rain-soaked city where the detective is an AI." },
    { label: "Summarize blockchain", prompt: "Summarize how a blockchain works in 3 bullet points, as if explaining to a business executive." },
  ],
  "text-to-sound": [
    { label: "Lo-fi study beats", prompt: "A calm, looping lo-fi hip-hop beat with soft piano, vinyl crackle, and gentle rain. 85 BPM, warm and cozy." },
    { label: "Epic film score", prompt: "An epic orchestral film score, rising tension, full strings and brass, cinematic climax, Hans Zimmer style." },
    { label: "Rain and thunder ambience", prompt: "Gentle rain falling on a rooftop, distant rolling thunder, occasional wind gusts, 10 minutes of peaceful ambience." },
  ],
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

type SidebarTab = "templates" | "history";

function TemplateItem({
  template,
  onApply,
}: {
  template: PromptTemplate;
  onApply: (t: PromptTemplate) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onApply(template)}
      className="group flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground leading-snug">{template.title}</span>
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/70">
          {template.category}
        </span>
      </div>
      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70">
        {template.description}
      </p>
    </button>
  );
}

function HistoryItem({
  item,
  onApply,
}: {
  item: {
    id: string;
    taskType: string;
    outputType: string;
    input: Record<string, unknown>;
    mediaUrls: string[] | null;
    status: string;
    createdAt: string;
  };
  onApply: (prompt: string) => void;
}) {
  const prompt = typeof item.input?.prompt === "string" ? item.input.prompt : "";
  const thumb = item.outputType === "image" && item.mediaUrls?.[0];

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const OutputIcon =
    item.outputType === "image" ? ImageIcon :
    item.outputType === "audio" ? Music :
    FileText;

  return (
    <button
      type="button"
      onClick={() => onApply(prompt)}
      disabled={!prompt}
      className="group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-40"
    >
      {/* Thumbnail or icon */}
      <div className="shrink-0 size-9 rounded-md overflow-hidden bg-muted flex items-center justify-center mt-0.5">
        {thumb ? (
          <img src={thumb} alt="" className="size-full object-cover" />
        ) : (
          <OutputIcon className="size-4 text-muted-foreground/40" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">
          {prompt || "(no prompt)"}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/40">
          {timeAgo(item.createdAt)}
        </p>
      </div>
    </button>
  );
}

function Sidebar({
  task,
  isAuthenticated,
  onApplyTemplate,
  onApplyPrompt,
  className,
}: {
  task: TaskType;
  isAuthenticated: boolean;
  onApplyTemplate: (t: PromptTemplate) => void;
  onApplyPrompt: (prompt: string) => void;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("templates");
  const templates = getTemplatesByTask(task);
  const history = useInferenceHistory();
  const taskHistory = (history.data?.items ?? []).filter(
    (item) => item.taskType === task
  );

  return (
    <aside className={cn("hidden w-56 shrink-0 flex-col overflow-hidden border-r bg-sidebar md:flex", className)}>
      {/* Tab switcher */}
      <div className="flex shrink-0 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeTab === "templates"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutTemplate className="size-3.5" />
          Templates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeTab === "history"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="size-3.5" />
          History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "templates" && (
          <div className="p-2 space-y-0.5">
            {templates.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground/50">
                No templates for this task.
              </p>
            ) : (
              templates.map((t) => (
                <TemplateItem key={t.id} template={t} onApply={onApplyTemplate} />
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-2 space-y-0.5">
            {!isAuthenticated ? (
              <p className="py-8 text-center text-xs text-muted-foreground/50">
                Sign in to see your history.
              </p>
            ) : history.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
              </div>
            ) : taskHistory.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground/50">
                No history yet for this task.
              </p>
            ) : (
              taskHistory.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onApply={onApplyPrompt}
                />
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Model picker dialog ──────────────────────────────────────────────────────

function formatRunCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M runs`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K runs`;
  return `${count} runs`;
}

function ModelPickerDialog({
  open,
  onOpenChange,
  models,
  selectedModel,
  onSelect,
  isLoadingModels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: ReplicateModel[] | undefined;
  selectedModel: ReplicateModel | null;
  onSelect: (model: ReplicateModel) => void;
  isLoadingModels: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = models?.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.owner.toLowerCase().includes(q) ||
      (m.description?.toLowerCase().includes(q) ?? false)
    );
  });

  function handleSelect(model: ReplicateModel) {
    onSelect(model);
    onOpenChange(false);
  }

  // Reset search when dialog opens
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-0 border-b px-4 pb-0 pt-4">
          <DialogTitle className="text-sm font-semibold">Select Model</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose an AI model to run your inference
          </DialogDescription>
          <div className="relative pt-3 pb-3">
            <Search className="absolute left-3 top-1/2 size-3.5 translate-y-[-20%] text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search by name, owner, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border/60 bg-muted/30 pl-9 pr-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {isLoadingModels ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : filtered?.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground/50">
              No models match &ldquo;{search}&rdquo;
            </p>
          ) : (
            <div className="space-y-1">
              {filtered?.map((m) => {
                const isActive =
                  m.owner === selectedModel?.owner &&
                  m.name === selectedModel?.name;
                return (
                  <button
                    key={`${m.owner}/${m.name}`}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className={cn(
                      "flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60",
                      isActive && "bg-primary/8 ring-1 ring-primary/20"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "font-mono text-sm font-semibold",
                            isActive && "text-primary"
                          )}
                        >
                          {m.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground/50">
                          {m.owner}
                        </span>
                      </div>
                      {m.description && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">
                          {m.description}
                        </p>
                      )}
                    </div>
                    {m.runCount > 0 && (
                      <span className="shrink-0 self-start pt-0.5 text-[10px] tabular-nums text-muted-foreground/40">
                        {formatRunCount(m.runCount)}
                      </span>
                    )}
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

// ── Extra params popover ──────────────────────────────────────────────────────

function ParamsPopover({
  extraFields,
  extraValues,
  setExtraValues,
}: {
  extraFields: InputField[];
  extraValues: Record<string, string | number>;
  setExtraValues: React.Dispatch<React.SetStateAction<Record<string, string | number>>>;
}) {
  if (extraFields.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <SlidersHorizontal className="size-3.5" />
          Options
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 max-w-[calc(100vw-2rem)] space-y-4 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Parameters
        </p>
        {extraFields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={`param-${field.name}`} className="text-xs">
              {field.label}
            </Label>
            {field.type === "textarea" ? (
              <Textarea
                id={`param-${field.name}`}
                placeholder={field.placeholder}
                rows={2}
                value={String(extraValues[field.name] ?? "")}
                onChange={(e) => setExtraValues((v) => ({ ...v, [field.name]: e.target.value }))}
                className="text-xs"
              />
            ) : (
              <Input
                id={`param-${field.name}`}
                type="number"
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
                value={String(extraValues[field.name] ?? "")}
                onChange={(e) => setExtraValues((v) => ({ ...v, [field.name]: e.target.value }))}
                className="h-7 text-xs"
              />
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ── Task-specific empty states ────────────────────────────────────────────────

function EmptyState({
  task,
  onSuggestion,
}: {
  task: TaskType;
  onSuggestion: (prompt: string) => void;
}) {
  const meta = {
    "text-to-image": {
      icon: ImagePlus,
      title: "Generate an image",
      desc: "Describe any scene, style, or concept — diffusion models will bring it to life.",
      accent: "bg-violet-500/10 ring-violet-500/20 text-violet-500/60",
      chip: "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10",
    },
    "text-to-text": {
      icon: MessageSquareText,
      title: "Ask anything",
      desc: "Generate text, answer questions, summarize, translate, or transform content with language models.",
      accent: "bg-sky-500/10 ring-sky-500/20 text-sky-500/60",
      chip: "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40 hover:bg-sky-500/10",
    },
    "text-to-sound": {
      icon: AudioLines,
      title: "Create audio",
      desc: "Generate music, sound effects, ambience, or speech from a text description.",
      accent: "bg-emerald-500/10 ring-emerald-500/20 text-emerald-500/60",
      chip: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10",
    },
  }[task];

  const Icon = meta.icon;

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center sm:gap-8 sm:py-16">
      <div className={cn("flex size-16 items-center justify-center rounded-2xl ring-1 sm:size-20", meta.accent)}>
        <Icon className="size-7 sm:size-9" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{meta.title}</h2>
        <p className="max-w-xs text-sm text-muted-foreground">{meta.desc}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {TASK_SUGGESTIONS[task].map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSuggestion(s.prompt)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:text-foreground",
              meta.chip
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Task-specific loading states ──────────────────────────────────────────────

function LoadingState({ task }: { task: TaskType }) {
  if (task === "text-to-image") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="aspect-square w-full max-w-sm animate-pulse rounded-2xl bg-muted/60" />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-violet-500" />
          Generating image…
        </p>
      </div>
    );
  }
  if (task === "text-to-text") {
    return (
      <div className="flex flex-col gap-3 py-8">
        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-sky-500" />
          Generating response…
        </p>
        {[100, 85, 90, 60].map((w, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded-md bg-muted/60"
            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex h-12 items-end gap-1">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-2 min-h-1 rounded-sm bg-emerald-500/40 animate-pulse"
            style={{ height: `${20 + Math.sin(i) * 60}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-emerald-500" />
        Generating audio…
      </p>
    </div>
  );
}

// ── Mobile history content ────────────────────────────────────────────────────

function MobileHistoryContent({
  task,
  isAuthenticated,
  onApply,
}: {
  task: TaskType;
  isAuthenticated: boolean;
  onApply: (prompt: string) => void;
}) {
  const history = useInferenceHistory();
  const taskHistory = (history.data?.items ?? []).filter(
    (item) => item.taskType === task
  );

  if (!isAuthenticated) {
    return <p className="py-8 text-center text-xs text-muted-foreground/50">Sign in to see your history.</p>;
  }
  if (history.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
      </div>
    );
  }
  if (taskHistory.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground/50">No history yet for this task.</p>;
  }
  return (
    <div className="space-y-0.5 p-2">
      {taskHistory.map((item) => (
        <HistoryItem key={item.id} item={item} onApply={onApply} />
      ))}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

interface InferencePageLayoutProps {
  task: TaskType;
}

export function InferencePageLayout({ task }: InferencePageLayoutProps) {
  const config = TASK_CONFIGS[task];
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Model ──────────────────────────────────────────────────────────────────
  const { data: models, isLoading: isLoadingModels } = useModels(task);
  const [selectedModel, setSelectedModel] = useState<ReplicateModel | null>(null);

  useEffect(() => {
    if (!models?.length) return;
    const [owner, name] = DEFAULT_MODEL_IDS[task].split("/");
    const found = models.find((m) => m.owner === owner && m.name === name);
    setSelectedModel(found ?? models[0]);
  }, [models, task]);

  const modelSchema = useModelSchema(selectedModel);
  const activeFields = modelSchema.data?.length ? modelSchema.data : config.fields;
  const promptField = activeFields.find((f) => f.name === "prompt");
  const extraFields  = activeFields.filter((f) => f.name !== "prompt");

  // ── Form state ─────────────────────────────────────────────────────────────
  const [promptValue, setPromptValue] = useState<string>(
    () => searchParams.get("prompt") ?? ""
  );
  const [extraValues, setExtraValues] = useState<Record<string, string | number>>(() => {
    const defaults: Record<string, string | number> = {};
    for (const field of extraFields) {
      if (field.defaultValue !== undefined) defaults[field.name] = field.defaultValue;
      const param = searchParams.get(field.name);
      if (param !== null)
        defaults[field.name] = field.type === "number" ? Number(param) : param;
    }
    return defaults;
  });

  const modelKey = selectedModel ? `${selectedModel.owner}/${selectedModel.name}` : "none";
  const prevModelKey = useRef(modelKey);
  useEffect(() => {
    if (prevModelKey.current !== modelKey) {
      prevModelKey.current = modelKey;
      setExtraValues(() => {
        const defaults: Record<string, string | number> = {};
        for (const field of extraFields) {
          if (field.defaultValue !== undefined) defaults[field.name] = field.defaultValue;
        }
        return defaults;
      });
    }
  });

  function buildInput(): Record<string, unknown> {
    const input: Record<string, unknown> = { prompt: promptValue };
    for (const field of extraFields) {
      const val = extraValues[field.name];
      if (val !== undefined && val !== "")
        input[field.name] = field.type === "number" ? Number(val) : val;
    }
    return input;
  }

  // ── Apply template / history ───────────────────────────────────────────────
  function handleApplyTemplate(t: PromptTemplate) {
    const { prompt, ...rest } = t.input;
    if (typeof prompt === "string") setPromptValue(prompt);
    const newExtras: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === "string" || typeof v === "number") newExtras[k] = v;
    }
    if (Object.keys(newExtras).length) setExtraValues((prev) => ({ ...prev, ...newExtras }));
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleApplyPrompt(prompt: string) {
    setPromptValue(prompt);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  // ── Inference hooks ────────────────────────────────────────────────────────
  const inference       = useInference();
  const requestMutation = inference.request;
  const submitMutation  = inference.submit;
  const inferencePhase  = inference.inferencePhase;
  const { isConnected, isAuthenticated, isSigningIn, signIn } = useAuth();
  const pendingInput = useRef<Record<string, unknown> | null>(null);
  const shouldAutoRequestAfterSignIn = useRef(false);
  const paymentRequirementsRef = useRef<string | null>(null);
  const [estimatedCostFromServer, setEstimatedCostFromServer] = useState<number | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { address, chainId } = useAccount();
  const { usdcFormatted, usdcRaw } = useWalletBalances(address, chainId);
  const selectedModelId = selectedModel ? `${selectedModel.owner}/${selectedModel.name}` : undefined;
  const costEstimate = useCostEstimate(task, selectedModelId);
  const x402Payment  = useX402Payment();

  const estimatedCostUsdc    = estimatedCostFromServer ?? costEstimate.data?.estimatedCostUsdc ?? null;
  const estimatedCostOnChain = estimatedCostUsdc != null ? usdcToOnChainAmount(estimatedCostUsdc) : null;
  const insufficientFunds    = usdcRaw !== undefined && estimatedCostOnChain !== null && usdcRaw < estimatedCostOnChain;

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
        { model: `${selectedModel.owner}/${selectedModel.name}`, task, input, paymentSignatureBase64 },
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
      const isAuth = parsed?.status === 401 || err.message.includes("401") || err.message.toLowerCase().includes("unauthorized");
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

  useEffect(() => {
    if (isConnected && !isAuthenticated && !isSigningIn && pendingInput.current) signIn();
  }, [isConnected, isAuthenticated, isSigningIn, signIn]);

  // Close payment dialog once inference starts running (payment confirmed on-chain)
  useEffect(() => {
    if (inferencePhase === "running") {
      setPaymentDialogOpen(false);
    }
  }, [inferencePhase]);

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

  function handleSubmit() {
    if (!selectedModel) return;
    const input = buildInput();
    if (!promptValue.trim()) return;
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
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

  function handleReset() {
    submitMutation.reset();
    requestMutation.reset();
    inference.resetResult();
    setPromptValue("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  const isLoading =
    requestMutation.isPending || submitMutation.isPending || isSigningIn || x402Payment.status === "signing";

  const loadingLabel = isSigningIn ? "Signing in…"
    : requestMutation.isPending ? "Requesting…"
    : x402Payment.status === "signing" ? "Sign in wallet…"
    : inferencePhase === "verifying" ? "Verifying payment…"
    : inferencePhase === "settling" ? "Confirming on-chain…"
    : inferencePhase === "running" ? "Running inference…"
    : submitMutation.isPending ? "Running…"
    : "Processing…";

  const canSubmit = !!selectedModel && !!promptValue.trim() && !isLoading;
  const result = inference.result ?? submitMutation.data?.response;
  const hasActiveContent = !!(result || isLoading || submitMutation.error);
  const taskNav = TASK_NAV.find((n) => n.task === task)!;
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [mobileTemplatesOpen, setMobileTemplatesOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  // ── Composer (one textarea, responsive bottom rows) ───────────────────────
  const composer = (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
      <textarea
        ref={textareaRef}
        value={promptValue}
        onChange={(e) => setPromptValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={promptField?.placeholder ?? "Enter your prompt…"}
        rows={3}
        className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none"
      />

      {/* Bottom row: model chip + cost + params + send */}
      <div className="flex items-center justify-between gap-2 px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setModelDialogOpen(true)}
            disabled={isLoadingModels || !models?.length}
            className="flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:bg-muted/80 disabled:opacity-40"
          >
            {isLoadingModels ? (
              <Loader2 className="size-3 shrink-0 animate-spin" />
            ) : (
              <ChevronDown className="size-3 shrink-0" />
            )}
            <span className="max-w-[120px] truncate font-mono text-[11px] sm:max-w-[200px]">
              {selectedModel ? selectedModel.name : "Select model"}
            </span>
          </button>
          {estimatedCostUsdc !== null && (
            <span className={cn(
              "shrink-0 px-1.5 py-1 font-mono text-[11px]",
              insufficientFunds ? "text-destructive" : "text-muted-foreground/50"
            )}>
              {formatUsdc(estimatedCostUsdc)}
            </span>
          )}
          <div className="hidden md:block">
            <ParamsPopover
              extraFields={extraFields}
              extraValues={extraValues}
              setExtraValues={setExtraValues}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          title={!selectedModel ? "Select a model" : !promptValue.trim() ? "Enter a prompt" : undefined}
          className={cn(
            "brand-cta flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 sm:size-8",
            !canSubmit && "opacity-30 cursor-not-allowed"
          )}
        >
          {isLoading
            ? <Loader2 className="size-3.5 animate-spin" />
            : <ArrowUp className="size-3.5" />
          }
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">

      {/* Mobile task tabs: full-width 3-col with icon + label stacked */}
      <div className="shrink-0 border-b bg-background/80 backdrop-blur md:hidden">
        <div className="grid grid-cols-3">
          {TASK_NAV.map(({ task: t, label, icon: Icon, href, activeClass }) => (
            <Link
              key={t}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-3.5 text-xs font-medium transition-colors",
                pathname === href
                  ? cn(activeClass, "border-b-2 border-current")
                  : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop task tabs */}
      <div className="hidden shrink-0 border-b bg-background/80 backdrop-blur md:block">
        <div className="flex items-center gap-1 px-3 py-2">
          {TASK_NAV.map(({ task: t, label, icon: Icon, href, activeClass }) => (
            <Link
              key={t}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                pathname === href
                  ? activeClass
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Body: sidebar (desktop-only) + main column */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <Sidebar
          task={task}
          isAuthenticated={isAuthenticated}
          onApplyTemplate={handleApplyTemplate}
          onApplyPrompt={handleApplyPrompt}
        />

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Scrollable content area */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {hasActiveContent ? (
              <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">

                {isLoading && !result && <LoadingState task={task} />}

                {result && !isLoading && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <taskNav.icon className="size-3.5 text-muted-foreground/60" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          {config.label}
                        </span>
                        {result.metrics?.predictTimeMs && (
                          <span className="text-xs text-muted-foreground">
                            · {(result.metrics.predictTimeMs / 1000).toFixed(1)}s
                            {result.metrics.actualCostUsdc !== undefined && (
                              <span className="ml-1">{formatUsdc(result.metrics.actualCostUsdc)}</span>
                            )}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <RefreshCw className="size-3" />
                        New
                      </button>
                    </div>
                    <InferenceResult response={result} outputType={config.outputType} />
                  </div>
                )}

                {submitMutation.error && !isLoading && !result && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/8 p-5 text-sm text-destructive">
                    {submitMutation.error.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col">

                {/* Desktop: centered empty state with icon */}
                <div className="hidden h-full items-center justify-center md:flex">
                  <EmptyState
                    task={task}
                    onSuggestion={(p) => { setPromptValue(p); textareaRef.current?.focus(); }}
                  />
                </div>

                {/* Mobile: compact top-aligned subtitle + suggestion chips */}
                <div className="flex flex-col gap-4 px-4 pb-4 pt-6 md:hidden">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {config.label}
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {task === "text-to-image" ? "Describe what you want to see"
                        : task === "text-to-text" ? "Ask anything"
                        : "Describe the audio you want"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TASK_SUGGESTIONS[task].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => { setPromptValue(s.prompt); setTimeout(() => textareaRef.current?.focus(), 50); }}
                        className={cn(
                          "rounded-full border px-3.5 py-2 text-xs text-muted-foreground transition-all active:scale-95",
                          task === "text-to-image"
                            ? "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground"
                            : task === "text-to-text"
                              ? "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-foreground"
                              : "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-foreground"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Always-docked bottom area */}
          <div className="shrink-0 border-t bg-background/95 backdrop-blur">

            {/* Mobile quick-action bar: Templates | History | Options */}
            <div className="flex items-center gap-0.5 border-b border-border/40 px-3 py-1.5 md:hidden">

              {/* Templates sheet */}
              <Sheet open={mobileTemplatesOpen} onOpenChange={setMobileTemplatesOpen}>
                <SheetTrigger asChild>
                  <button type="button" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                    <LayoutTemplate className="size-3.5" />
                    Templates
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="flex h-[65vh] flex-col p-0">
                  <SheetHeader className="shrink-0 border-b px-4 py-3">
                    <SheetTitle className="text-sm font-medium">Templates</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-2">
                    {getTemplatesByTask(task).length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground/50">No templates for this task.</p>
                    ) : (
                      getTemplatesByTask(task).map((tmpl) => (
                        <TemplateItem
                          key={tmpl.id}
                          template={tmpl}
                          onApply={(t) => { handleApplyTemplate(t); setMobileTemplatesOpen(false); }}
                        />
                      ))
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* History sheet */}
              <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
                <SheetTrigger asChild>
                  <button type="button" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                    <Clock className="size-3.5" />
                    History
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="flex h-[65vh] flex-col p-0">
                  <SheetHeader className="shrink-0 border-b px-4 py-3">
                    <SheetTitle className="text-sm font-medium">History</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    <MobileHistoryContent
                      task={task}
                      isAuthenticated={isAuthenticated}
                      onApply={(p) => { handleApplyPrompt(p); setMobileHistoryOpen(false); }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Extra params */}
              {extraFields.length > 0 && (
                <ParamsPopover
                  extraFields={extraFields}
                  extraValues={extraValues}
                  setExtraValues={setExtraValues}
                />
              )}

              {/* Loading status */}
              {isLoading && (
                <span className="ml-auto font-mono text-[11px] text-muted-foreground/60">
                  {loadingLabel}
                </span>
              )}
            </div>

            {/* Composer */}
            <div className="mx-auto max-w-2xl px-3 pb-4 pt-3 sm:px-4 sm:pb-5">
              {composer}
              <p className="mt-2 text-center text-[10px] text-muted-foreground/40">
                <span className="hidden sm:inline">⌘↵ to run · </span>Pay per request in USDC
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Model picker dialog (shared by mobile + desktop) */}
      <ModelPickerDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        models={models}
        selectedModel={selectedModel}
        onSelect={setSelectedModel}
        isLoadingModels={isLoadingModels}
      />

      <ConnectDialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen} />
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
