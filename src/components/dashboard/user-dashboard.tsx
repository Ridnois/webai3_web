"use client";

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
import {
  Shield,
  LayoutDashboard,
  ImagePlus,
  MessageSquareText,
  AudioLines,
} from "lucide-react";

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

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
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

  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Shield className="size-12 text-muted-foreground/50" />
        <div>
          <p className="text-lg font-medium">Sign in to view your dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your wallet and sign in to see your inference metrics
          </p>
        </div>
        <Button onClick={signIn} disabled={isSigningIn} variant="outline">
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
  const recentItems = history?.items.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutDashboard className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          {sessionAddress && (
            <p className="text-sm text-muted-foreground">
              {sessionAddress.slice(0, 6)}...{sessionAddress.slice(-4)}
            </p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Inferences"
          value={summary?.totalInferences.toLocaleString() ?? "0"}
        />
        <StatCard
          title="Total Compute Time"
          value={summary ? formatDuration(summary.totalTimeMs) : "0s"}
        />
        <StatCard
          title="Success Rate"
          value={
            summary && summary.totalInferences > 0
              ? `${Math.round((summary.successCount / summary.totalInferences) * 100)}%`
              : "N/A"
          }
          description={
            summary && summary.totalInferences > 0
              ? `${summary.successCount} succeeded, ${summary.failedCount} failed`
              : undefined
          }
        />
        <StatCard
          title="Avg Response Time"
          value={
            summary?.avgResponseMs != null
              ? `${summary.avgResponseMs.toLocaleString()} ms`
              : "N/A"
          }
          description={`${summary?.modelsUsed ?? 0} models used`}
        />
      </div>

      {/* Bottom row: models + activity breakdown | recent inferences */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Per-model breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Models Used</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.byModel.length ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.byModel.map((m) => {
                    const pct =
                      summary && summary.totalInferences > 0
                        ? (m.totalCalls / summary.totalInferences) * 100
                        : 0;
                    return (
                      <div key={m.model} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {m.model}
                          </code>
                          <span className="text-muted-foreground">
                            {m.totalCalls} calls
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
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

          {/* Task type breakdown */}
          {stats?.byTask && stats.byTask.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Task Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {stats.byTask.map((t) => {
                    const Icon = TASK_ICONS[t.taskType] ?? MessageSquareText;
                    const label = TASK_LABELS[t.taskType] ?? t.taskType;
                    return (
                      <div
                        key={t.taskType}
                        className="flex items-center gap-2 rounded-lg border px-4 py-3"
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.totalCalls} inferences
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: recent inferences */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Inferences</CardTitle>
            {recentItems.length > 0 && (
              <Link href="/history">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No inferences yet. Run your first one!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentItems.map((item) => (
                  <InferenceHistoryCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
