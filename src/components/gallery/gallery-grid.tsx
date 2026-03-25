"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  Play,
  Pause,
} from "lucide-react";
import { useGallery } from "@/hooks/use-gallery";
import { getPrompt, shortTimeAgo } from "@/lib/output-constants";
import { fromGalleryItem } from "@/types/output-item";
import { OutputLightbox } from "@/components/output/output-lightbox";
import { EmptyState } from "@/components/ui/empty-state";
import type { GalleryItem } from "@/hooks/use-gallery";

// ─── Filters ─────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: "all", label: "All", icon: undefined },
  { value: "text-to-image", label: "Images", icon: ImagePlus },
  { value: "text-to-text", label: "Text", icon: MessageSquareText },
  { value: "text-to-sound", label: "Audio", icon: AudioLines },
] as const;

// ─── Full cards (masonry / grid) ─────────────────────────────────────────────

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
          {(getPrompt(item.input) ?? "").slice(0, 80)}
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
            {(getPrompt(item.input) ?? "").slice(0, 80)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {item.model.split("/").pop()} &middot; {shortTimeAgo(item.createdAt)}
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
          {item.model.split("/").pop()} &middot; {shortTimeAgo(item.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ─── Compact cards (horizontal scroll on mobile, embedded) ───────────────────

function CompactImageCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const url = item.mediaUrls?.[0];
  if (!url) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-28 shrink-0 overflow-hidden rounded-xl active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <img
        src={url}
        alt=""
        className="w-28 aspect-[3/4] object-cover block"
        loading="lazy"
      />
    </button>
  );
}

function CompactAudioCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-28 shrink-0 aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border bg-card active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/12 text-violet-600 dark:text-violet-400">
        <AudioLines className="size-5" />
      </div>
      <p className="text-[10px] text-muted-foreground">{shortTimeAgo(item.createdAt)}</p>
    </button>
  );
}

function CompactTextCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-28 shrink-0 aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border bg-card active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/8 text-primary">
        <MessageSquareText className="size-5" />
      </div>
      <p className="text-[10px] text-muted-foreground">{shortTimeAgo(item.createdAt)}</p>
    </button>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

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

function EmbeddedMobileSkeleton() {
  return (
    <div className="flex gap-2.5">
      {[..."12345"].map((_, i) => (
        <Skeleton key={i} className="w-28 shrink-0 aspect-[3/4] rounded-xl" />
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function GalleryGrid({ embedded = false }: { embedded?: boolean }) {
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
  const next = useCallback(
    () => setFocusIdx((i) => (i !== null && i < items.length - 1 ? i + 1 : i)),
    [items.length]
  );

  const firstLoad = isLoading && items.length === 0;
  const empty = !isLoading && items.length === 0;

  return (
    <div>
      {/* Filter header — hidden when embedded (homepage provides its own header) */}
      {!embedded && (
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm px-4 py-4 sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="hidden sm:block text-3xl font-bold tracking-tight mb-6">Gallery</h1>
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
      )}

      {/* Content */}
      <div className={embedded ? "" : "mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8"}>
        {empty && <EmptyState title="Nothing here yet" />}

        {/* ── Embedded layout ── */}
        {embedded && (
          <>
            {/* Mobile: horizontal scroll */}
            <div className="sm:hidden">
              {firstLoad ? (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
                  <EmbeddedMobileSkeleton />
                </div>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
                  {items.map((item, idx) => (
                    <div key={item.id} className="shrink-0">
                      {item.outputType === "image" ? (
                        <CompactImageCard item={item} onClick={() => setFocusIdx(idx)} />
                      ) : item.outputType === "audio" ? (
                        <CompactAudioCard item={item} onClick={() => setFocusIdx(idx)} />
                      ) : (
                        <CompactTextCard item={item} onClick={() => setFocusIdx(idx)} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: masonry */}
            <div className="hidden sm:block">
              {firstLoad && (
                <div className="columns-3 gap-4 lg:columns-4">
                  <GallerySkeleton />
                </div>
              )}
              {items.length > 0 && (
                <div className="columns-3 gap-4 lg:columns-4">
                  {items.map((item, idx) => (
                    <div key={item.id} className="break-inside-avoid mb-4">
                      {item.outputType === "image" ? (
                        <ImageCard item={item} onClick={() => setFocusIdx(idx)} />
                      ) : item.outputType === "audio" ? (
                        <AudioCard item={item} onClick={() => setFocusIdx(idx)} />
                      ) : (
                        <TextCard item={item} onClick={() => setFocusIdx(idx)} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Full gallery layout ── */}
        {!embedded && (
          <>
            {firstLoad && (
              <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
                <GallerySkeleton />
              </div>
            )}
            {items.length > 0 && (
              <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
                {items.map((item, idx) => (
                  <div key={item.id} className="break-inside-avoid mb-3 sm:mb-4">
                    {item.outputType === "image" ? (
                      <ImageCard item={item} onClick={() => setFocusIdx(idx)} />
                    ) : item.outputType === "audio" ? (
                      <AudioCard item={item} onClick={() => setFocusIdx(idx)} />
                    ) : (
                      <TextCard item={item} onClick={() => setFocusIdx(idx)} />
                    )}
                  </div>
                ))}
              </div>
            )}

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
          </>
        )}
      </div>

      {/* Lightbox — unified OutputLightbox replaces the old inline Lightbox */}
      {focused && focusIdx !== null && (
        <OutputLightbox
          item={fromGalleryItem(focused)}
          open
          onOpenChange={(open) => { if (!open) setFocusIdx(null); }}
          onPrev={prev}
          onNext={next}
          hasPrev={focusIdx > 0}
          hasNext={focusIdx < items.length - 1}
          indexLabel={`${focusIdx + 1} of ${items.length}`}
        />
      )}
    </div>
  );
}
