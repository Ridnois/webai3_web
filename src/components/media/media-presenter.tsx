"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
} from "lucide-react";
import type { InferenceHistoryItem } from "@/hooks/use-inference-history";

const TASK_ICONS: Record<string, typeof ImagePlus> = {
  "text-to-image": ImagePlus,
  "text-to-text": MessageSquareText,
  "text-to-sound": AudioLines,
};

const TASK_LABELS: Record<string, string> = {
  "text-to-image": "Text to Image",
  "text-to-text": "Text to Text",
  "text-to-sound": "Text to Sound",
};

interface MediaPresenterProps {
  item: InferenceHistoryItem;
  /** For navigation between items */
  allItems?: InferenceHistoryItem[];
  /** Callback when navigating to another item */
  onChangeItem?: (item: InferenceHistoryItem) => void;
  /** Show inference details on hover */
  showDetailsOverlay?: boolean;
  /** Size variant: thumbnail for grids, compact for lists, full for dedicated pages */
  variant?: "thumbnail" | "compact" | "full";
  /** Allow fullscreen mode */
  allowFullscreen?: boolean;
  /** Click handler for custom behavior */
  onClick?: () => void;
  /** CSS classes */
  className?: string;
}

interface AudioPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
}

function AudioPlayer({ url, title }: { url: string; title?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    duration: 0,
  });

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setState((s) => ({ ...s, isPlaying: !s.isPlaying }));
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !state.isMuted;
    setState((s) => ({ ...s, isMuted: !s.isMuted }));
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setState((s) => ({
      ...s,
      currentTime: audioRef.current?.currentTime || 0,
    }));
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setState((s) => ({
      ...s,
      duration: audioRef.current?.duration || 0,
    }));
  };

  const handleEnded = () => {
    setState((s) => ({ ...s, isPlaying: false }));
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Title */}
      {title && <p className="text-sm font-medium truncate">{title}</p>}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label={state.isPlaying ? "Pause" : "Play"}
        >
          {state.isPlaying ? (
            <Pause className="size-4 ml-0.5" />
          ) : (
            <Play className="size-4 ml-0.5" />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={state.duration || 0}
            value={state.currentTime}
            onChange={(e) => {
              if (!audioRef.current) return;
              audioRef.current.currentTime = Number(e.target.value);
            }}
            className="w-full h-1 bg-muted rounded-full cursor-pointer accent-primary"
          />
        </div>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label={state.isMuted ? "Unmute" : "Mute"}
        >
          {state.isMuted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </button>
      </div>

      {/* Time display */}
      <div className="text-xs text-muted-foreground">
        {formatTime(state.currentTime)} / {formatTime(state.duration)}
      </div>
    </div>
  );
}

function FullscreenViewer({
  item,
  allItems,
  open,
  onOpenChange,
  onChangeItem,
}: {
  item: InferenceHistoryItem;
  allItems?: InferenceHistoryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeItem?: (item: InferenceHistoryItem) => void;
}) {
  const isImage = item.outputType === "image";
  const isAudio = item.outputType === "audio";
  const mediaUrl = item.mediaUrls?.[0];

  const currentIndex = allItems ? allItems.findIndex((i) => i.id === item.id) : -1;
  const hasNext = allItems ? currentIndex < allItems.length - 1 : false;
  const hasPrev = allItems ? currentIndex > 0 : false;

  const goToNext = () => {
    if (hasNext && allItems && onChangeItem) {
      onChangeItem(allItems[currentIndex + 1]);
    }
  };

  const goPrev = () => {
    if (hasPrev && allItems && onChangeItem) {
      onChangeItem(allItems[currentIndex - 1]);
    }
  };

  const handleDownload = async () => {
    if (!mediaUrl) return;
    const a = document.createElement("a");
    a.href = mediaUrl;
    a.download = `${item.id}-${isImage ? "image" : "audio"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] sm:h-screen p-0 border-0 bg-black/95 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {TASK_LABELS[item.taskType] || item.taskType}
            </p>
            <p className="text-xs text-white/60 mt-0.5">
              {item.model}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors text-white ml-2"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Media container */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {isImage && mediaUrl && (
            <img
              src={mediaUrl}
              alt="Generated image"
              className="max-h-full max-w-full object-contain"
            />
          )}
          {isAudio && mediaUrl && (
            <div className="p-8 text-white max-w-md w-full">
              <AudioPlayer url={mediaUrl} title={TASK_LABELS[item.taskType]} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 gap-3 flex-shrink-0 flex-wrap">
          <div className="text-sm text-white/60">
            {allItems ? `${currentIndex + 1} of ${allItems.length}` : ""}
          </div>

          <div className="flex gap-2">
            {isImage && mediaUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white text-sm"
              >
                <Download className="size-4" />
                Download
              </button>
            )}
          </div>

          {allItems && (
            <div className="flex gap-2">
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={!hasNext}
                className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}

          <Link href={`/history/${item.id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              Details
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MediaPresenter({
  item,
  allItems,
  onChangeItem,
  showDetailsOverlay = true,
  variant = "full",
  allowFullscreen = true,
  onClick,
  className = "",
}: MediaPresenterProps) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const Icon = TASK_ICONS[item.taskType] ?? MessageSquareText;
  const isImage = item.outputType === "image";
  const isAudio = item.outputType === "audio";
  const mediaUrl = item.mediaUrls?.[0];
  const prompt = typeof item.input?.prompt === "string" ? item.input.prompt : undefined;

  // Thumbnail variant - compact grid display
  if (variant === "thumbnail") {
    return (
      <>
        <div
          onClick={() => {
            if (allowFullscreen && isImage) setFullscreenOpen(true);
            onClick?.();
          }}
          className={`group relative overflow-hidden rounded-lg border bg-gradient-to-br from-muted to-muted/70 aspect-square cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${className}`}
        >
          {isImage && mediaUrl ? (
            <img
              src={mediaUrl}
              alt="Generated"
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : isAudio && mediaUrl ? (
            <div className="absolute inset-0 size-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-violet-500/5">
              <AudioLines className="size-12 text-violet-500/50" />
            </div>
          ) : (
            <div className="absolute inset-0 size-full flex items-center justify-center">
              <Icon className="size-8 sm:size-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Overlay on hover */}
          {showDetailsOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-3">
              <div className="text-white text-xs">
                <p className="font-medium">{TASK_LABELS[item.taskType]}</p>
                {prompt && (
                  <p className="text-white/70 line-clamp-1">{prompt.slice(0, 40)}</p>
                )}
              </div>
            </div>
          )}

          {/* Fullscreen badge */}
          {allowFullscreen && isImage && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex size-8 items-center justify-center rounded bg-black/50 text-white">
                <Maximize2 className="size-3.5" />
              </div>
            </div>
          )}

          {/* Status badge */}
          <Badge
            variant={
              item.status === "succeeded"
                ? "default"
                : item.status === "failed"
                  ? "destructive"
                  : "secondary"
            }
            className="absolute top-2 right-2 text-xs z-20"
          >
            {item.status}
          </Badge>
        </div>

        {allowFullscreen && isImage && (
          <FullscreenViewer
            item={item}
            allItems={allItems}
            open={fullscreenOpen}
            onOpenChange={setFullscreenOpen}
            onChangeItem={onChangeItem}
          />
        )}
      </>
    );
  }

  // Compact variant - for list/card displays
  if (variant === "compact") {
    return (
      <div className={`flex gap-4 rounded-lg border p-4 ${className}`}>
        {/* Media preview */}
        <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/70">
          {isImage && mediaUrl ? (
            <img
              src={mediaUrl}
              alt="Preview"
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
          ) : isAudio ? (
            <div className="absolute inset-0 size-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-violet-500/5">
              <AudioLines className="size-8 text-violet-500/50" />
            </div>
          ) : (
            <div className="absolute inset-0 size-full flex items-center justify-center">
              <Icon className="size-8 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{TASK_LABELS[item.taskType]}</p>
            <Badge variant="secondary" className="text-xs">
              {item.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{item.model}</p>
          {prompt && (
            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
              {prompt}
            </p>
          )}
        </div>

        {/* Actions */}
        {allowFullscreen && isImage && (
          <button
            onClick={() => setFullscreenOpen(true)}
            className="flex-shrink-0 p-2 hover:bg-muted rounded transition-colors"
          >
            <Maximize2 className="size-4" />
          </button>
        )}
      </div>
    );
  }

  // Full variant - for dedicated result pages
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Media display */}
      <div className="relative rounded-lg border bg-gradient-to-br from-muted to-muted/70 overflow-hidden">
        {isImage && mediaUrl ? (
          <div
            onClick={() => {
              if (allowFullscreen) setFullscreenOpen(true);
            }}
            className={`aspect-video sm:aspect-auto flex items-center justify-center ${
              allowFullscreen ? "cursor-pointer hover:opacity-95 transition-opacity" : ""
            }`}
          >
            <img
              src={mediaUrl}
              alt="Result"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        ) : isAudio && mediaUrl ? (
          <div className="p-6 max-w-md">
            <AudioPlayer url={mediaUrl} title={TASK_LABELS[item.taskType]} />
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 bg-gradient-to-br from-muted to-muted/70">
            <Icon className="size-12 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Inference info */}
      {showDetailsOverlay && (
        <div className="space-y-2 p-4 rounded-lg border bg-muted/50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Task</p>
              <p className="font-medium">{TASK_LABELS[item.taskType]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={
                  item.status === "succeeded"
                    ? "default"
                    : item.status === "failed"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs"
              >
                {item.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Model</p>
              <code className="text-xs">{item.model}</code>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Response Time</p>
              <p className="text-xs">
                {item.predictTimeMs ? `${(item.predictTimeMs / 1000).toFixed(1)}s` : "N/A"}
              </p>
            </div>
          </div>
          {prompt && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prompt</p>
              <p className="text-sm text-muted-foreground italic">{prompt}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {allowFullscreen && isImage && (
        <Button
          onClick={() => setFullscreenOpen(true)}
          variant="outline"
          className="w-full"
        >
          <Maximize2 className="size-4" />
          View Fullscreen
        </Button>
      )}

      {allowFullscreen && isImage && (
        <FullscreenViewer
          item={item}
          allItems={allItems}
          open={fullscreenOpen}
          onOpenChange={setFullscreenOpen}
          onChangeItem={onChangeItem}
        />
      )}
    </div>
  );
}
