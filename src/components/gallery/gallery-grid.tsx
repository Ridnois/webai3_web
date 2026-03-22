"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Pause,
  X,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { useGallery } from "@/hooks/use-gallery";
import type { GalleryItem } from "@/hooks/use-gallery";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrompt(item: GalleryItem): string {
  return typeof item.input?.prompt === "string"
    ? item.input.prompt
    : JSON.stringify(item.input);
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "text-to-image", label: "Images", icon: ImagePlus },
  { value: "text-to-text", label: "Text", icon: MessageSquareText },
  { value: "text-to-sound", label: "Audio", icon: AudioLines },
] as const;

// ─── Cards ────────────────────────────────────────────────────────────────────

function ImageCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const url = item.mediaUrls?.[0];
  if (!url) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow hover:shadow-lg"
    >
      <img
        src={url}
        alt=""
        className="w-full block transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="absolute bottom-0 inset-x-0 p-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
        <p className="text-[11px] text-white/90 line-clamp-2 leading-snug">
          {getPrompt(item).slice(0, 80)}
        </p>
      </div>
    </button>
  );
}

function AudioCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const url = item.mediaUrls?.[0];
  if (!url) return null;

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!audio) {
      const el = new Audio(url);
      el.addEventListener("ended", () => setPlaying(false));
      setAudio(el);
      el.play();
      setPlaying(true);
    } else if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="p-4 flex items-center gap-3">
        <div
          onClick={toggle}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 transition-transform active:scale-90"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-foreground/80 line-clamp-2 leading-snug">
            {getPrompt(item).slice(0, 80)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {item.model.split("/").pop()} &middot; {timeAgo(item.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

function TextCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const text =
    typeof item.outputData === "string"
      ? item.outputData
      : Array.isArray(item.outputData)
        ? item.outputData.join("")
        : JSON.stringify(item.outputData);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="p-4">
        <p className="text-xs text-foreground/80 line-clamp-4 leading-relaxed whitespace-pre-wrap">
          {text.slice(0, 200)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          {item.model.split("/").pop()} &middot; {timeAgo(item.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

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
  const [copied, setCopied] = useState(false);
  const prompt = getPrompt(item);
  const isImage = item.outputType === "image";
  const isAudio = item.outputType === "audio";
  const mediaUrl = item.mediaUrls?.[0];
  const model = item.model.split("/").pop() ?? item.model;

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={
          isImage
            ? "max-w-5xl max-h-[95dvh] overflow-hidden p-0 gap-0 bg-black border-white/5 rounded-xl"
            : "max-w-2xl max-h-[90dvh] overflow-hidden p-0 gap-0 rounded-xl"
        }
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" && hasPrev) onPrev();
          if (e.key === "ArrowRight" && hasNext) onNext();
        }}
      >
        <DialogTitle className="sr-only">
          {item.taskType} result
        </DialogTitle>

        {/* ── Image ── */}
        {isImage && mediaUrl && (
          <div className="flex flex-col max-h-[95dvh]">
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition hover:text-white"
            >
              <X className="size-4" />
            </button>

            {hasPrev && <NavArrow dir="l" onClick={onPrev} />}
            {hasNext && <NavArrow dir="r" onClick={onNext} />}

            {/* Image */}
            <div className="flex flex-1 items-center justify-center bg-black min-h-0 px-2 py-2 sm:px-10 sm:py-4">
              <img
                src={mediaUrl}
                alt=""
                className="max-h-[65dvh] max-w-full object-contain rounded"
              />
            </div>

            {/* Info bar */}
            <div className="shrink-0 border-t border-white/5 bg-black/95 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-start gap-3 mb-3">
                <p className="flex-1 text-[13px] leading-relaxed text-white/80 line-clamp-3 sm:line-clamp-none">
                  {prompt}
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

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-[11px] text-white/40">
                  <span>{model}</span>
                  <span>{shortAddr(item.userAddress)}</span>
                  {item.predictTimeMs && <span>{(item.predictTimeMs / 1000).toFixed(1)}s</span>}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={mediaUrl}
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Download className="size-3" />
                    Save
                  </a>
                  <Link
                    href={`/r/${item.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Link2 className="size-3" />
                    Link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Audio ── */}
        {isAudio && mediaUrl && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <p className="text-sm font-medium">Audio</p>
              <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition">
                <X className="size-4" />
              </button>
            </div>

            {hasPrev && <NavArrow dir="l" onClick={onPrev} />}
            {hasNext && <NavArrow dir="r" onClick={onNext} />}

            <div className="px-5 pb-5 space-y-4">
              <div className="rounded-lg border p-3">
                <audio controls className="w-full" src={mediaUrl} autoPlay>
                  Your browser does not support audio.
                </audio>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{prompt}</p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{model} &middot; {shortAddr(item.userAddress)}</span>
                <div className="flex items-center gap-2">
                  <a href={mediaUrl} download className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-muted transition">
                    <Download className="size-3" /> Save
                  </a>
                  <Link href={`/r/${item.id}`} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-muted transition">
                    <Link2 className="size-3" /> Link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Text ── */}
        {item.outputType === "text" && textOutput && (
          <div className="flex flex-col max-h-[90dvh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <p className="text-sm font-medium">Text</p>
              <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition">
                <X className="size-4" />
              </button>
            </div>

            {hasPrev && <NavArrow dir="l" onClick={onPrev} />}
            {hasNext && <NavArrow dir="r" onClick={onNext} />}

            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                <p className="text-sm text-foreground/80 italic">{prompt}</p>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {textOutput}
              </pre>
            </div>

            <div className="shrink-0 border-t px-5 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{model} &middot; {shortAddr(item.userAddress)}</span>
              <Link href={`/r/${item.id}`} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-muted transition">
                <Link2 className="size-3" /> Link
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SKELETON_RATIOS = [
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[2/3]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
];

function GallerySkeleton() {
  return (
    <>
      {SKELETON_RATIOS.map((ratio, i) => (
        <div key={i} className={`break-inside-avoid mb-3 sm:mb-4 ${ratio}`}>
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ))}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GalleryGrid() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const task = filter === "all" ? undefined : filter;
  const { data, isLoading } = useGallery(page, task);

  useEffect(() => {
    if (!data?.items) return;
    if (page === 1) {
      setItems(data.items);
    } else {
      setItems((prev) => [...prev, ...data.items]);
    }
    setLoadingMore(false);
  }, [data, page]);

  const focused = focusIdx !== null ? items[focusIdx] : null;
  const hasMore = data ? data.items.length >= data.limit : false;

  function changeFilter(v: string) {
    setFilter(v);
    setPage(1);
    setItems([]);
    setFocusIdx(null);
  }

  const prev = useCallback(() => setFocusIdx((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const next = useCallback(() => setFocusIdx((i) => (i !== null && i < items.length - 1 ? i + 1 : i)), [items.length]);

  const firstLoad = isLoading && items.length === 0;
  const empty = !isLoading && items.length === 0;

  return (
    <div>
      {/* Header — sticky on mobile for quick filter access */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm px-4 py-4 sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="hidden sm:block text-3xl font-bold tracking-tight mb-6">
            Gallery
          </h1>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {FILTERS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => changeFilter(value)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-full transition-colors ${
                  filter === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {Icon && <Icon className="size-3.5" />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">
        {firstLoad && (
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
            <GallerySkeleton />
          </div>
        )}

        {empty && (
          <p className="py-24 text-center text-sm text-muted-foreground">
            Nothing here yet
          </p>
        )}

        {items.length > 0 && (
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
            {items.map((item, idx) => {
              const card =
                item.outputType === "image" ? (
                  <ImageCard key={item.id} item={item} onClick={() => setFocusIdx(idx)} />
                ) : item.outputType === "audio" ? (
                  <AudioCard key={item.id} item={item} onClick={() => setFocusIdx(idx)} />
                ) : (
                  <TextCard key={item.id} item={item} onClick={() => setFocusIdx(idx)} />
                );
              return (
                <div key={item.id} className="break-inside-avoid mb-3 sm:mb-4">
                  {card}
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loadingMore && (
          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              onClick={() => { setLoadingMore(true); setPage((p) => p + 1); }}
            >
              Load more
            </Button>
          </div>
        )}

        {loadingMore && (
          <div className="mt-6 columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
            <GallerySkeleton />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {focused && (
        <Lightbox
          item={focused}
          onClose={() => setFocusIdx(null)}
          onPrev={prev}
          onNext={next}
          hasPrev={focusIdx !== null && focusIdx > 0}
          hasNext={focusIdx !== null && focusIdx < items.length - 1}
        />
      )}
    </div>
  );
}
