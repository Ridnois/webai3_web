"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  Globe,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Play,
  Pause,
  X,
  Clock,
  User,
  Sparkles,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { useGallery } from "@/hooks/use-gallery";
import type { GalleryItem } from "@/hooks/use-gallery";

const TASK_LABELS: Record<string, string> = {
  "text-to-image": "Image",
  "text-to-text": "Text",
  "text-to-sound": "Audio",
};

function getPrompt(item: GalleryItem): string {
  return typeof item.input?.prompt === "string"
    ? item.input.prompt
    : JSON.stringify(item.input);
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Image Card ────────────────────────────────────────────────────────────────

function ImageCard({
  item,
  onClick,
}: {
  item: GalleryItem;
  onClick: () => void;
}) {
  const prompt = getPrompt(item);
  const url = item.mediaUrls?.[0];
  if (!url) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative break-inside-avoid mb-4 block w-full overflow-hidden rounded-xl bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <img
        src={url}
        alt={prompt.slice(0, 100)}
        className="w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />
      {/* Hover overlay — gradient from bottom */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 translate-y-2 rounded-b-xl p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-sm font-medium text-white line-clamp-2 drop-shadow-sm">
          {prompt.slice(0, 120)}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0 backdrop-blur-sm">
            {item.model.split("/").pop()}
          </Badge>
          <span className="text-[11px] text-white/70">
            {shortAddr(item.userAddress)}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Audio Card ────────────────────────────────────────────────────────────────

function AudioCard({
  item,
  onClick,
}: {
  item: GalleryItem;
  onClick: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const prompt = getPrompt(item);
  const url = item.mediaUrls?.[0];
  if (!url) return null;

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (!audioEl) {
      const audio = new Audio(url);
      audio.addEventListener("ended", () => setIsPlaying(false));
      setAudioEl(audio);
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
    } else {
      audioEl.play();
      setIsPlaying(true);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mb-4 block w-full overflow-hidden rounded-xl border bg-gradient-to-br from-violet-500/10 via-background to-fuchsia-500/10 text-left transition-all hover:shadow-lg hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="p-5">
        {/* Play button */}
        <div className="mb-4 flex items-center gap-3">
          <div
            onClick={togglePlay}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5 ml-0.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="text-[10px] mb-1">
              Audio
            </Badge>
            <p className="text-xs text-muted-foreground truncate">
              {item.model.split("/").pop()}
            </p>
          </div>
        </div>
        {/* Prompt */}
        <p className="text-sm line-clamp-3 text-muted-foreground">
          {prompt.slice(0, 150)}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          {shortAddr(item.userAddress)}
        </p>
      </div>
    </button>
  );
}

// ─── Text Card ─────────────────────────────────────────────────────────────────

function TextCard({
  item,
  onClick,
}: {
  item: GalleryItem;
  onClick: () => void;
}) {
  const prompt = getPrompt(item);
  const textOutput =
    typeof item.outputData === "string"
      ? item.outputData
      : Array.isArray(item.outputData)
        ? item.outputData.join("")
        : JSON.stringify(item.outputData);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group mb-4 block w-full overflow-hidden rounded-xl border text-left transition-all hover:shadow-lg hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            Text
          </Badge>
          <span className="text-[11px] text-muted-foreground truncate">
            {item.model.split("/").pop()}
          </span>
        </div>
        {/* Prompt */}
        <p className="text-xs text-muted-foreground mb-3 line-clamp-1 italic">
          &ldquo;{prompt.slice(0, 80)}&rdquo;
        </p>
        {/* Output preview */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm line-clamp-5 whitespace-pre-wrap leading-relaxed">
            {textOutput.slice(0, 300)}
          </p>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/60">
          {shortAddr(item.userAddress)}
        </p>
      </div>
    </button>
  );
}

// ─── Lightbox helpers ───────────────────────────────────────────────────────────

function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute ${isPrev ? "left-4" : "right-4"} top-1/2 z-10 -translate-y-1/2 flex size-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-white/70 backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.12] hover:text-white hover:scale-105 hover:border-white/[0.15] active:scale-95`}
    >
      {isPrev ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}

function MetaChip({
  icon: Icon,
  children,
  dark,
}: {
  icon: typeof Clock;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${
        dark
          ? "bg-white/[0.08] text-white/60"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="size-3 shrink-0" />
      {children}
    </span>
  );
}

function ActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  dark,
}: {
  icon: typeof Download;
  label: string;
  href?: string;
  onClick?: () => void;
  dark?: boolean;
}) {
  const className = `inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
    dark
      ? "border border-white/[0.1] bg-white/[0.06] text-white/80 backdrop-blur-sm hover:bg-white/[0.12] hover:text-white hover:border-white/[0.18]"
      : "border bg-background text-foreground hover:bg-accent"
  }`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" download className={className}>
        <Icon className="size-3.5" />
        {label}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <Icon className="size-3.5" />
        {label}
      </button>
    );
  }

  return null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  item,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  item: GalleryItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const [promptCopied, setPromptCopied] = useState(false);
  const prompt = getPrompt(item);
  const isImage = item.outputType === "image";
  const isAudio = item.outputType === "audio";
  const mediaUrl = item.mediaUrls?.[0];
  const modelName = item.model.split("/").pop() ?? item.model;

  const textOutput =
    item.outputType === "text"
      ? typeof item.outputData === "string"
        ? item.outputData
        : Array.isArray(item.outputData)
          ? item.outputData.join("")
          : JSON.stringify(item.outputData, null, 2)
      : null;

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={
          isImage
            ? "sm:max-w-5xl max-h-[92vh] overflow-hidden p-0 gap-0 bg-black border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50"
            : "sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl"
        }
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" && hasPrev) onPrev();
          if (e.key === "ArrowRight" && hasNext) onNext();
        }}
      >
        <DialogTitle className="sr-only">
          {TASK_LABELS[item.taskType] ?? item.taskType} by {shortAddr(item.userAddress)}
        </DialogTitle>

        {/* ── Image lightbox ── */}
        {isImage && mediaUrl && (
          <div className="flex flex-col max-h-[92vh]">
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-black/40 text-white/70 backdrop-blur-xl transition-all hover:bg-black/60 hover:text-white"
            >
              <X className="size-4" />
            </button>

            {/* Nav arrows */}
            {hasPrev && <NavButton direction="prev" onClick={onPrev} />}
            {hasNext && <NavButton direction="next" onClick={onNext} />}

            {/* Image area — dark, centered, with breathing room */}
            <div className="relative flex flex-1 items-center justify-center bg-black px-12 py-6 min-h-0">
              <img
                src={mediaUrl}
                alt={prompt.slice(0, 100)}
                className="max-h-[60vh] max-w-full rounded-lg object-contain"
              />
            </div>

            {/* Detail panel — slide-up glass effect */}
            <div className="shrink-0 border-t border-white/[0.06] bg-gradient-to-t from-black via-black/95 to-black/90 px-6 py-5">
              {/* Prompt with copy */}
              <div className="group/prompt relative mb-4">
                <p className="text-[13px] leading-relaxed text-white/85 pr-8">
                  {prompt}
                </p>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="absolute right-0 top-0 flex size-7 items-center justify-center rounded-md text-white/30 transition-colors hover:text-white/70"
                  title="Copy prompt"
                >
                  {promptCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <MetaChip icon={Sparkles} dark>{modelName}</MetaChip>
                <MetaChip icon={User} dark>{shortAddr(item.userAddress)}</MetaChip>
                {item.predictTimeMs && (
                  <MetaChip icon={Clock} dark>{(item.predictTimeMs / 1000).toFixed(1)}s</MetaChip>
                )}
                <span className="text-[11px] text-white/30 ml-auto">
                  {formatDate(item.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <ActionButton icon={Download} label="Download" href={mediaUrl} dark />
                <Link href={`/r/${item.id}`} className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.12] hover:text-white hover:border-white/[0.18]">
                  <Link2 className="size-3.5" />
                  Permalink
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Audio lightbox ── */}
        {isAudio && mediaUrl && (
          <div className="flex flex-col">
            {/* Header gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/15 via-background to-fuchsia-500/15 px-6 pt-6 pb-8">
              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>

              {/* Nav */}
              {hasPrev && (
                <button type="button" onClick={onPrev} className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border bg-background/80 text-muted-foreground backdrop-blur-sm transition-all hover:bg-background hover:text-foreground">
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {hasNext && (
                <button type="button" onClick={onNext} className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border bg-background/80 text-muted-foreground backdrop-blur-sm transition-all hover:bg-background hover:text-foreground">
                  <ChevronRight className="size-4" />
                </button>
              )}

              {/* Decorative icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-500/10">
                <AudioLines className="size-7 text-violet-500 dark:text-violet-400" />
              </div>

              {/* Title + meta */}
              <div className="text-center">
                <h3 className="text-base font-semibold tracking-tight mb-2">Audio Generation</h3>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <MetaChip icon={Sparkles}>{modelName}</MetaChip>
                  <MetaChip icon={User}>{shortAddr(item.userAddress)}</MetaChip>
                  {item.predictTimeMs && (
                    <MetaChip icon={Clock}>{(item.predictTimeMs / 1000).toFixed(1)}s</MetaChip>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Prompt */}
              <div className="relative rounded-xl bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-2">Prompt</p>
                <p className="text-sm leading-relaxed text-foreground/85 pr-8">
                  {prompt}
                </p>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-muted-foreground/30 transition-colors hover:text-muted-foreground"
                  title="Copy prompt"
                >
                  {promptCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Player */}
              <div className="rounded-xl border bg-background p-4">
                <audio controls className="w-full" src={mediaUrl} autoPlay aria-label="Generated audio">
                  Your browser does not support the audio element.
                </audio>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] text-muted-foreground/50">{formatDate(item.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <ActionButton icon={Download} label="Download" href={mediaUrl} />
                  <Link href={`/r/${item.id}`} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium text-foreground bg-background transition-all hover:bg-accent">
                    <Link2 className="size-3.5" />
                    Permalink
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Text lightbox ── */}
        {item.outputType === "text" && textOutput && (
          <div className="flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="relative shrink-0 border-b px-6 py-5">
              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>

              {/* Nav */}
              {hasPrev && (
                <button type="button" onClick={onPrev} className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-all hover:text-foreground">
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {hasNext && (
                <button type="button" onClick={onNext} className="absolute right-14 top-4 z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-muted">
                  <ChevronRight className="size-4" />
                </button>
              )}

              <div className="flex items-start gap-3 pr-16">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageSquareText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight mb-1.5">Text Generation</h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <MetaChip icon={Sparkles}>{modelName}</MetaChip>
                    <MetaChip icon={User}>{shortAddr(item.userAddress)}</MetaChip>
                    {item.predictTimeMs && (
                      <MetaChip icon={Clock}>{(item.predictTimeMs / 1000).toFixed(1)}s</MetaChip>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Prompt */}
              <div className="relative rounded-xl bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-2">Prompt</p>
                <p className="text-sm leading-relaxed text-foreground/85 italic pr-8">
                  &ldquo;{prompt}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-muted-foreground/30 transition-colors hover:text-muted-foreground"
                  title="Copy prompt"
                >
                  {promptCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Output */}
              <div className="rounded-xl border bg-background p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3">Output</p>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-[family-name:var(--font-geist-mono)]">
                  {textOutput}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/50">{formatDate(item.createdAt)}</span>
              <Link href={`/r/${item.id}`} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium text-foreground bg-background transition-all hover:bg-accent">
                <Link2 className="size-3.5" />
                Permalink
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function ImageSkeleton() {
  const heights = ["h-56", "h-72", "h-64", "h-80", "h-60", "h-72", "h-56", "h-68"];
  return (
    <>
      {heights.map((h, i) => (
        <div key={i} className="mb-4 break-inside-avoid">
          <Skeleton className={`${h} w-full rounded-xl`} />
        </div>
      ))}
    </>
  );
}

function MixedSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3]" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Grid ─────────────────────────────────────────────────────────────────

export function GalleryGrid() {
  const [page, setPage] = useState(1);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const task = taskFilter === "all" ? undefined : taskFilter;
  const { data, isLoading } = useGallery(page, task);

  const focusedItem = data && focusedIndex !== null ? data.items[focusedIndex] : null;

  const handlePrev = useCallback(() => {
    setFocusedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const handleNext = useCallback(() => {
    if (!data) return;
    setFocusedIndex((i) => (i !== null && i < data.items.length - 1 ? i + 1 : i));
  }, [data]);

  // Check if current filter is image-only for masonry layout
  const isImageOnly = taskFilter === "text-to-image";
  const hasMediaItems = data?.items.some((i) => i.outputType === "image" || i.outputType === "audio");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Globe className="size-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Gallery
          </h1>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-lg text-muted-foreground">
          Explore AI-generated creations shared by the community.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-8 flex justify-center">
        <Tabs
          value={taskFilter}
          onValueChange={(v) => {
            setTaskFilter(v);
            setPage(1);
            setFocusedIndex(null);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="text-to-image">
              <ImagePlus className="size-4 mr-1.5" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text-to-text">
              <MessageSquareText className="size-4 mr-1.5" />
              Text
            </TabsTrigger>
            <TabsTrigger value="text-to-sound">
              <AudioLines className="size-4 mr-1.5" />
              Audio
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading */}
      {isLoading && (
        isImageOnly ? (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            <ImageSkeleton />
          </div>
        ) : (
          <MixedSkeleton />
        )
      )}

      {/* Empty state */}
      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Globe className="size-12 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No shared creations yet
          </p>
          <p className="text-xs text-muted-foreground/75">
            Be the first to share your AI generation with the community.
          </p>
        </div>
      )}

      {/* Gallery items */}
      {data && data.items.length > 0 && (
        <>
          {isImageOnly ? (
            /* ── Masonry layout for images ── */
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
              {data.items.map((item, idx) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  onClick={() => setFocusedIndex(idx)}
                />
              ))}
            </div>
          ) : (
            /* ── Mixed grid for all types ── */
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {data.items.map((item, idx) => {
                if (item.outputType === "image") {
                  return (
                    <ImageCard
                      key={item.id}
                      item={item}
                      onClick={() => setFocusedIndex(idx)}
                    />
                  );
                }
                if (item.outputType === "audio") {
                  return (
                    <AudioCard
                      key={item.id}
                      item={item}
                      onClick={() => setFocusedIndex(idx)}
                    />
                  );
                }
                return (
                  <TextCard
                    key={item.id}
                    item={item}
                    onClick={() => setFocusedIndex(idx)}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.items.length < data.limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      )}

      {/* Lightbox */}
      {focusedItem && (
        <Lightbox
          item={focusedItem}
          onClose={() => setFocusedIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={focusedIndex !== null && focusedIndex > 0}
          hasNext={focusedIndex !== null && data !== undefined && focusedIndex < data.items.length - 1}
        />
      )}
    </div>
  );
}
