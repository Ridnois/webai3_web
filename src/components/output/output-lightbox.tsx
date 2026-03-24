"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { AudioResult } from "@/components/inference/audio-result";
import { toastSuccess } from "@/lib/toast";
import { shortAddr, TASK_LABELS } from "@/lib/output-constants";
import { normalizeTextOutput } from "@/lib/output-helpers";
import type { OutputItem } from "@/types/output-item";

interface OutputLightboxProps {
  item: OutputItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Navigation
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  indexLabel?: string; // e.g. "3 of 12"

  // Owner controls
  isOwner?: boolean;
  onTogglePublic?: () => void;
  isToggling?: boolean;
}

function NavArrow({ dir, onClick }: { dir: "l" | "r"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute ${dir === "l" ? "left-2 sm:left-4" : "right-2 sm:right-4"} top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:bg-black/60 active:scale-95`}
    >
      {dir === "l" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}

export function OutputLightbox({
  item,
  open,
  onOpenChange,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  indexLabel,
  isOwner = false,
  onTogglePublic,
  isToggling = false,
}: OutputLightboxProps) {
  const [copied, setCopied] = useState(false);
  const isImage = item.outputType === "image";
  const isAudio = item.outputType === "audio";
  const isText = item.outputType === "text";
  const mediaUrl = item.mediaUrls[0] ?? null;
  const model = item.model?.split("/").pop() ?? item.model;
  const isPublic = item.isPublic === true;

  function copyPrompt() {
    if (!item.prompt) return;
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={
          isImage
            ? "max-w-5xl max-h-[100dvh] sm:max-h-[95dvh] overflow-hidden p-0 gap-0 bg-black border-white/5 rounded-none sm:rounded-xl w-full"
            : "max-w-lg max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden p-0 gap-0 rounded-none sm:rounded-xl w-full"
        }
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
          if (e.key === "ArrowRight" && hasNext) onNext?.();
        }}
      >
        <DialogTitle className="sr-only">
          {item.taskType ? TASK_LABELS[item.taskType] ?? item.taskType : "Result"}
        </DialogTitle>

        {/* ── Image ── */}
        {isImage && mediaUrl && (
          <div className="flex flex-col max-h-[100dvh] sm:max-h-[95dvh]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition hover:text-white"
            >
              <X className="size-4" />
            </button>

            {hasPrev && onPrev && <NavArrow dir="l" onClick={onPrev} />}
            {hasNext && onNext && <NavArrow dir="r" onClick={onNext} />}

            <div className="flex flex-1 items-center justify-center bg-black min-h-0 px-2 py-10 sm:px-10 sm:py-4">
              <img
                src={mediaUrl}
                alt=""
                className="max-h-[60dvh] sm:max-h-[65dvh] max-w-full object-contain rounded"
              />
            </div>

            {/* Info bar */}
            <div className="shrink-0 border-t border-white/5 bg-black/95 px-4 py-3 sm:px-6 sm:py-4">
              {item.prompt && (
                <div className="flex items-start gap-3 mb-3">
                  <p className="flex-1 text-[13px] leading-relaxed text-white/80 line-clamp-3 sm:line-clamp-none">
                    {item.prompt}
                  </p>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="shrink-0 flex size-7 items-center justify-center rounded text-white/30 hover:text-white/70 transition-colors"
                    title="Copy prompt"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-[11px] text-white/40">
                  {model && <span>{model}</span>}
                  {item.userAddress && <span>{shortAddr(item.userAddress)}</span>}
                  {item.predictTimeMs != null && <span>{(item.predictTimeMs / 1000).toFixed(1)}s</span>}
                  {indexLabel && <span>{indexLabel}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {/* Owner: visibility toggle */}
                  {isOwner && onTogglePublic && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={isPublic}
                        disabled={isToggling}
                        onCheckedChange={() => onTogglePublic()}
                        aria-label="Share to public gallery"
                        className="border-white/20 data-[state=checked]:bg-white/20"
                      />
                      <span className="text-[11px] text-white/50 select-none">Public</span>
                    </label>
                  )}
                  <a
                    href={mediaUrl}
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Download className="size-3" />
                    Save
                  </a>
                  {item.id && (
                    <Link
                      href={`/r/${item.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Link2 className="size-3" />
                      Link
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Audio ── */}
        {isAudio && mediaUrl && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <p className="text-sm font-medium">
                {item.taskType ? TASK_LABELS[item.taskType] ?? "Audio" : "Audio"}
              </p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {hasPrev && onPrev && <NavArrow dir="l" onClick={onPrev} />}
            {hasNext && onNext && <NavArrow dir="r" onClick={onNext} />}

            <div className="px-5 pb-5 space-y-4">
              <AudioResult output={mediaUrl} />
              {item.prompt && (
                <p className="text-sm text-foreground/80 leading-relaxed">{item.prompt}</p>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {model && <span>{model}</span>}
                  {item.userAddress && <span>· {shortAddr(item.userAddress)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && onTogglePublic && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={isPublic}
                        disabled={isToggling}
                        onCheckedChange={() => onTogglePublic()}
                        aria-label="Share to public gallery"
                      />
                      <span className="text-[11px] text-muted-foreground select-none">Public</span>
                    </label>
                  )}
                  <a
                    href={mediaUrl}
                    download
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-muted transition"
                  >
                    <Download className="size-3" /> Save
                  </a>
                  {item.id && (
                    <Link
                      href={`/r/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-muted transition"
                    >
                      <Link2 className="size-3" /> Link
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Text ── */}
        {isText && (
          <div className="flex flex-col max-h-[100dvh] sm:max-h-[90dvh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <p className="text-sm font-medium">Text</p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {hasPrev && onPrev && <NavArrow dir="l" onClick={onPrev} />}
            {hasNext && onNext && <NavArrow dir="r" onClick={onNext} />}

            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
              {item.prompt && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                  <p className="text-sm text-foreground/80 italic">{item.prompt}</p>
                </div>
              )}
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {item.textContent ?? normalizeTextOutput(null)}
              </pre>
            </div>

            <div className="shrink-0 border-t px-5 py-3 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {model && <span>{model}</span>}
                {item.userAddress && <span>· {shortAddr(item.userAddress)}</span>}
              </div>
              <div className="flex items-center gap-2">
                {isOwner && onTogglePublic && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={isPublic}
                      disabled={isToggling}
                      onCheckedChange={() => onTogglePublic()}
                      aria-label="Share to public gallery"
                    />
                    <span className="text-[11px] text-muted-foreground select-none">Public</span>
                  </label>
                )}
                {item.id && (
                  <Link
                    href={`/r/${item.id}`}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-muted transition"
                  >
                    <Link2 className="size-3" /> Link
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
