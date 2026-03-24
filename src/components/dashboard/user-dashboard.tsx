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
import { InferenceHistoryCard } from "@/components/history/inference-history-card";
import { OutputLightbox } from "@/components/output/output-lightbox";
import { ConnectSignInButton } from "@/components/auth/connect-sign-in-button";
import { fromHistoryItem } from "@/types/output-item";
import { TASK_LABELS, TASK_ICONS, formatTimeAgo } from "@/lib/output-constants";
import {
  Shield,
  LayoutDashboard,
  TrendingUp,
  MessageSquareText,
} from "lucide-react";
import type { InferenceHistoryItem } from "@/hooks/use-inference-history";

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

function MediaGridItem({
  item,
  onOpenFullscreen,
}: {
  item: InferenceHistoryItem;
  onOpenFullscreen: () => void;
}) {
  const Icon = TASK_ICONS[item.taskType] ?? MessageSquareText;
  const hasImage = item.outputType === "image" && item.mediaUrls?.[0];
  const timeAgo = formatTimeAgo(new Date(item.createdAt));

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-muted aspect-square cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
      <button
        onClick={(e) => {
          e.preventDefault();
          onOpenFullscreen();
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
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
        ))}
      </div>
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
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
    sessionAddress,
  } = useAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: history, isLoading: historyLoading } = useInferenceHistory(1);
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);

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
        <ConnectSignInButton className="mt-2" />
      </div>
    );
  }

  if (statsLoading || historyLoading) {
    return <DashboardSkeleton />;
  }

  const summary = stats?.summary;
  const recentItems = history?.items.slice(0, 12) ?? [];
  const imageItems = recentItems.filter((i) => i.outputType === "image");
  const fullscreenItem = fullscreenIdx !== null ? imageItems[fullscreenIdx] : null;

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

      {/* Hero Stats */}
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

      {/* Fullscreen Lightbox */}
      {fullscreenItem && fullscreenIdx !== null && (
        <OutputLightbox
          item={fromHistoryItem(fullscreenItem)}
          open
          onOpenChange={(open) => { if (!open) setFullscreenIdx(null); }}
          onPrev={() => setFullscreenIdx((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setFullscreenIdx((i) => (i !== null && i < imageItems.length - 1 ? i + 1 : i))}
          hasPrev={fullscreenIdx > 0}
          hasNext={fullscreenIdx < imageItems.length - 1}
          indexLabel={`${fullscreenIdx + 1} of ${imageItems.length}`}
          isOwner
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
            {imageItems.map((item, idx) => (
              <MediaGridItem
                key={item.id}
                item={item}
                onOpenFullscreen={() => setFullscreenIdx(idx)}
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

      {/* Recent Activity */}
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
