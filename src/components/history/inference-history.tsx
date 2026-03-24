"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useInferenceHistory } from "@/hooks/use-inference-history";
import { InferenceHistoryCard } from "./inference-history-card";
import { ConnectSignInButton } from "@/components/auth/connect-sign-in-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, History } from "lucide-react";

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
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Shield className="size-12 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Sign in to view your history
          </p>
          <p className="text-xs text-muted-foreground/75 mt-1">
            Connect your wallet and sign in to see your past inferences
          </p>
        </div>
        <ConnectSignInButton />
      </div>
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
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load history. Please try again.
      </div>
    );
  }

  const items = history.data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <History className="size-12 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            No inferences yet
          </p>
          <p className="text-xs text-muted-foreground/75 mt-1">
            Run your first inference to see it here
          </p>
        </div>
      </div>
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
