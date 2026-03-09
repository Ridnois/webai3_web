"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Copy,
  Check,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared copy-to-clipboard button                                    */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
      title="Copy details"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Variant config                                                     */
/* ------------------------------------------------------------------ */

type ToastVariant = "success" | "error" | "info" | "warning";

const variantConfig: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    containerClass: string;
    iconBgClass: string;
    iconClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    containerClass: "border-emerald-500/30",
    iconBgClass: "bg-emerald-500/10",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: XCircle,
    containerClass: "border-destructive/30",
    iconBgClass: "bg-destructive/10",
    iconClass: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "border-amber-500/30",
    iconBgClass: "bg-amber-500/10",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    containerClass: "border-blue-500/30",
    iconBgClass: "bg-blue-500/10",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
};

/* ------------------------------------------------------------------ */
/*  Core rich toast renderer                                           */
/* ------------------------------------------------------------------ */

interface RichToastOptions {
  title: string;
  description?: string;
  hint?: string;
  footer?: string;
  duration?: number;
  copyable?: boolean;
}

function showRichToast(variant: ToastVariant, opts: RichToastOptions) {
  const { title, description, hint, footer, duration, copyable } = opts;
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  const clipboardParts = [title];
  if (description) clipboardParts.push(description);
  if (hint) clipboardParts.push(`Hint: ${hint}`);
  if (footer) clipboardParts.push(footer);
  const clipboardText = clipboardParts.join("\n");

  const showCopy = copyable ?? (variant === "error" || variant === "warning");

  toast.custom(
    () => (
      <div
        className={`w-[min(420px,calc(100vw-2rem))] rounded-xl border bg-card p-4 shadow-lg ${cfg.containerClass}`}
      >
        <div className="flex items-start gap-3">
          <div className={`rounded-md p-2 ${cfg.iconBgClass}`}>
            <Icon className={`size-4 ${cfg.iconClass}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              {showCopy && <CopyButton text={clipboardText} />}
            </div>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
            {hint && (
              <p className="mt-2 rounded-md border border-border/70 bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
                {hint}
              </p>
            )}
            {footer && (
              <p className="mt-2 font-[family-name:var(--font-geist-mono)] text-[11px] text-muted-foreground/85">
                {footer}
              </p>
            )}
          </div>
        </div>
      </div>
    ),
    { duration: duration ?? (variant === "error" ? 8000 : 5000) }
  );
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function toastSuccess(title: string, description?: string) {
  showRichToast("success", { title, description });
}

export function toastError(
  title: string,
  opts?: { description?: string; hint?: string; footer?: string }
) {
  showRichToast("error", { title, ...opts });
}

export function toastWarning(
  title: string,
  opts?: { description?: string; hint?: string }
) {
  showRichToast("warning", { title, ...opts });
}

export function toastInfo(title: string, description?: string) {
  showRichToast("info", { title, description });
}

export function toastInferenceError(error: Error, title: string) {
  // Inline the InferenceApiError check to avoid a circular import
  const parsed =
    "status" in error && "code" in error && "hint" in error
      ? (error as Error & {
          status: number;
          code: string | null;
          hint: string | null;
        })
      : null;

  const description = parsed?.message ?? error.message;
  const hint = parsed?.hint ?? undefined;
  const footer = parsed
    ? [parsed.code, parsed.status ? `HTTP ${parsed.status}` : null]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  showRichToast("error", { title, description, hint, footer, duration: 8000 });
}

export function toastInsufficientFunds(
  formattedCost: string,
  usdcBalance: string | undefined
) {
  showRichToast("error", {
    title: "Insufficient USDC balance",
    description: `This inference requires ${formattedCost}, but your wallet has ${usdcBalance !== undefined ? `$${usdcBalance}` : "an unknown balance"}.`,
    hint: "Top up USDC on the selected network before retrying.",
    duration: 8000,
  });
}
