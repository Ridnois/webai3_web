"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";
import { useInferenceHistory } from "@/hooks/use-inference-history";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { InferenceHistoryCard } from "@/components/history/inference-history-card";
import {
  Shield,
  LayoutDashboard,
  ImagePlus,
  MessageSquareText,
  AudioLines,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { InferenceHistoryItem } from "@/hooks/use-inference-history";

const TASK_LABELS: Record<string, string> = {
  "text-to-image": "Image",
  "text-to-text": "Text",
  "text-to-sound": "Audio",
};

const TASK_ICONS: Record<string, typeof ImagePlus> = {
  "text-to-image": ImagePlus,
  "text-to-text": MessageSquareText,
  "text-to-sound": AudioLines,
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function HeroStatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: typeof TrendingUp;
}) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0 flex size-10 sm:size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5 sm:size-6" />
          </div>
        )}
      </div>
    </div>
  );
}

function ImageViewer({
  item,
  allItems,
  open,
  onOpenChange,
  onChangeItem,
}: {
  item: InferenceHistoryItem;
  allItems: InferenceHistoryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeItem: (item: InferenceHistoryItem) => void;
}) {
  const currentIndex = allItems.findIndex((i) => i.id === item.id);
  const hasNext = currentIndex < allItems.length - 1;
  const hasPrev = currentIndex > 0;

  const goToNext = () => {
    if (hasNext) {
      onChangeItem(allItems[currentIndex + 1]);
    }
  };

  const goPrev = () => {
    if (hasPrev) {
      onChangeItem(allItems[currentIndex - 1]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] sm:h-screen p-0 border-0 bg-black/95 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {TASK_LABELS[item.taskType] || item.taskType}
            </p>
            <p className="text-xs text-white/60 mt-0.5">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center overflow-hidden relative">
          {item.mediaUrls?.[0] && (
            <img
              src={item.mediaUrls[0]}
              alt="Generated image"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Navigation and info footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 gap-2">
          <div className="text-sm text-white/60">
            {currentIndex + 1} of {allItems.length}
          </div>

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

          <Link href={`/history/${item.id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              View Details
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MediaGridItem({
  item,
  onOpenFullscreen,
}: {
  item: InferenceHistoryItem;
  onOpenFullscreen: (item: InferenceHistoryItem) => void;
}) {
  const Icon = TASK_ICONS[item.taskType] ?? MessageSquareText;
  const hasImage = item.outputType === "image" && item.mediaUrls?.[0];
  const timeAgo = formatTimeAgo(new Date(item.createdAt));

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-muted aspect-square cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
      <button
        onClick={(e) => {
          e.preventDefault();
          onOpenFullscreen(item);
        }}
        className="absolute inset-0 z-10"
        aria-label="View fullscreen"
      />

      {hasImage ? (
        <img
          src={item.mediaUrls![0]}
          alt="Generated"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="size-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/70">
          <Icon className="size-8 sm:size-10 text-muted-foreground/40" />
        </div>
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-3">
        <div className="text-white text-xs">
          <p className="font-medium">{TASK_LABELS[item.taskType]}</p>
          <p className="text-white/70">{timeAgo}</p>
        </div>
      </div>

      {/* Status badge */}
      <Badge
        variant={item.status === "succeeded" ? "default" : item.status === "failed" ? "destructive" : "secondary"}
        className="absolute top-2 right-2 text-xs z-20"
      >
        {item.status}
      </Badge>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Hero stats skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
        ))}
      </div>

      {/* Media grid skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>

      {/* Stats section skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

export function UserDashboard() {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    signIn,
    isSigningIn,
    sessionAddress,
  } = useAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: history, isLoading: historyLoading } = useInferenceHistory(1);
  const [fullscreenItem, setFullscreenItem] = useState<InferenceHistoryItem | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const handleOpenFullscreen = (item: InferenceHistoryItem) => {
    setFullscreenItem(item);
    setFullscreenOpen(true);
  };

  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 sm:py-24 text-center px-4">
        <div className="flex size-12 sm:size-16 items-center justify-center rounded-full bg-primary/10">
          <Shield className="size-6 sm:size-8 text-primary" />
        </div>
        <div>
          <p className="text-lg sm:text-xl font-semibold">Sign in to view your dashboard</p>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your wallet and sign in to see your inference metrics and recent work
          </p>
        </div>
        <Button onClick={signIn} disabled={isSigningIn} className="mt-2">
          <Shield className="size-4" />
          {isSigningIn ? "Signing..." : "Sign In"}
        </Button>
      </div>
    );
  }

  if (statsLoading || historyLoading) {
    return <DashboardSkeleton />;
  }

  const summary = stats?.summary;
  const recentItems = history?.items.slice(0, 12) ?? [];
  const imageItems = recentItems.filter((i) => i.outputType === "image");

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 sm:size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutDashboard className="size-5 sm:size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          {sessionAddress && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {sessionAddress.slice(0, 6)}...{sessionAddress.slice(-4)}
            </p>
          )}
        </div>
      </div>

      {/* Hero Stats - 3 column responsive grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <HeroStatCard
          title="Total Spent"
          value={`$${(summary?.totalSpentUsdc ?? 0).toFixed(4)}`}
          description={`${summary?.totalInferences || 0} inferences`}
          icon={TrendingUp}
        />
        <HeroStatCard
          title="Success Rate"
          value={
            summary && summary.totalInferences > 0
              ? `${Math.round((summary.successCount / summary.totalInferences) * 100)}%`
              : "N/A"
          }
          description={`${summary?.successCount || 0} of ${summary?.totalInferences || 0}`}
        />
        <HeroStatCard
          title="Compute Time"
          value={summary ? formatDuration(summary.totalTimeMs) : "0s"}
          description={`Avg: ${summary?.avgResponseMs?.toLocaleString() || 0}ms`}
        />
      </div>

      {/* Fullscreen Image Viewer */}
      {fullscreenItem && (
        <ImageViewer
          item={fullscreenItem}
          allItems={imageItems}
          open={fullscreenOpen}
          onOpenChange={setFullscreenOpen}
          onChangeItem={setFullscreenItem}
        />
      )}

      {/* Media Gallery Section */}
      {imageItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-lg sm:text-xl font-semibold">Generated Images</h2>
            {imageItems.length >= 12 && (
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  View all
                </Button>
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {imageItems.map((item) => (
              <MediaGridItem
                key={item.id}
                item={item}
                onOpenFullscreen={handleOpenFullscreen}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom row: Detailed stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Models Used */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Models Used</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.byModel.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No data yet
              </p>
            ) : (
              <div className="space-y-4">
                {stats.byModel.map((m) => {
                  const pct =
                    summary && summary.totalInferences > 0
                      ? (m.totalCalls / summary.totalInferences) * 100
                      : 0;
                  return (
                    <div key={m.model} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono truncate">
                          {m.model.replace(/^.*?\//, "")}
                        </code>
                        <span className="text-sm font-medium text-muted-foreground">
                          {m.totalCalls}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Breakdown */}
        {stats?.byTask && stats.byTask.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Task Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4">
                {stats.byTask.map((t) => {
                  const Icon = TASK_ICONS[t.taskType] ?? MessageSquareText;
                  const label = TASK_LABELS[t.taskType] ?? t.taskType;
                  const pct =
                    summary && summary.totalInferences > 0
                      ? (t.totalCalls / summary.totalInferences) * 100
                      : 0;
                  return (
                    <div
                      key={t.taskType}
                      className="flex items-center gap-3 rounded-lg border p-3 sm:p-4"
                    >
                      <div className="flex size-9 sm:size-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <Icon className="size-4 sm:size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{label}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>{t.totalCalls}</span>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity - List view for non-image inferences */}
      {recentItems.length > imageItems.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentItems
                .filter((i) => i.outputType !== "image")
                .slice(0, 5)
                .map((item) => (
                  <InferenceHistoryCard key={item.id} item={item} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
