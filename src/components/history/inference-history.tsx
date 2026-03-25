"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useInferenceHistory } from "@/hooks/use-inference-history";
import { InferenceHistoryCard } from "./inference-history-card";
import { AuthGuardScreen } from "@/components/auth/auth-guard-screen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { History } from "lucide-react";

export function InferenceHistory() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const history = useInferenceHistory(page);

  if (authLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGuardScreen
        iconSize="lg"
        title="Sign in to view your history"
        subtitle="Connect your wallet and sign in to see your past inferences"
      />
    );
  }

  if (history.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (history.error) {
    return (
      <ErrorAlert>Failed to load history. Please try again.</ErrorAlert>
    );
  }

  const items = history.data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No inferences yet"
        subtitle="Run your first inference to see it here"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <InferenceHistoryCard key={item.id} item={item} />
      ))}

      <div className="flex items-center justify-center gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={items.length < 20}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
