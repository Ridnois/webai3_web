"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAdminMetrics } from "@/hooks/use-admin-metrics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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

function LoadingSkeleton() {
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
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const {
    isAdmin,
    isAuthenticated,
    isLoading: isAuthLoading,
    isSigningIn,
    signIn,
  } = useAuth();
  const { data, isLoading, error } = useAdminMetrics();

  if (isAuthLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAdmin) {
    if (!isAuthenticated) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">Admin sign-in required</p>
            <p className="text-sm text-muted-foreground">
              Connect your admin wallet and sign in to continue.
            </p>
            <div className="mt-4">
              <Button onClick={signIn} disabled={isSigningIn} variant="outline">
                {isSigningIn ? "Signing..." : "Sign In"}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-sm text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-destructive">
            Failed to load metrics
          </p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, models } = data;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue (USDC)"
          value={`$${summary.totalRevenueUsdc.toFixed(4)}`}
          description={`$${summary.totalEstimatedUsdc.toFixed(4)} estimated`}
        />
        <StatCard
          title="Total Inferences"
          value={summary.totalInferences.toLocaleString()}
        />
        <StatCard
          title="Unique Users"
          value={summary.uniqueUsers}
        />
        <StatCard
          title="Total Inference Time"
          value={formatDuration(summary.totalTimeMs)}
          description="All inferences combined"
        />
        <StatCard
          title="Unique Models"
          value={summary.uniqueModels}
        />
        <StatCard
          title="Avg Response Time"
          value={
            summary.avgResponseMs != null
              ? `${summary.avgResponseMs.toLocaleString()} ms`
              : "N/A"
          }
          description="Succeeded inferences only"
        />
      </div>

      {/* Model table */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Model Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No inference data yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Model</th>
                    <th className="pb-3 pr-4 font-medium text-right">
                      Total Calls
                    </th>
                    <th className="pb-3 pr-4 font-medium text-right">
                      Success Rate
                    </th>
                    <th className="pb-3 pr-4 font-medium text-right">
                      Avg Response
                    </th>
                    <th className="pb-3 pr-4 font-medium text-right">
                      Revenue (USDC)
                    </th>
                    <th className="pb-3 font-medium text-right">Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => {
                    const successRate =
                      m.totalCalls > 0
                        ? Math.round(
                            (m.successCount / m.totalCalls) * 100
                          )
                        : 0;

                    return (
                      <tr
                        key={m.model}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {m.model}
                          </code>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {m.totalCalls.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Badge
                            variant={
                              successRate >= 90
                                ? "default"
                                : successRate >= 70
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {successRate}%
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {m.avgResponseMs != null
                            ? `${m.avgResponseMs.toLocaleString()} ms`
                            : "N/A"}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-xs">
                          ${m.totalRevenueUsdc.toFixed(4)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {m.lastUsed
                            ? new Date(m.lastUsed).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
