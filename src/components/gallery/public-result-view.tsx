"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/layout/back-button";
import { Globe } from "lucide-react";
import { TASK_ICONS, TASK_LABELS, shortAddr } from "@/lib/output-constants";
import { fromGalleryItem } from "@/types/output-item";
import { OutputView } from "@/components/output/output-view";
import { PageContainer } from "@/components/layout/page-container";
import type { GalleryItem } from "@/hooks/use-gallery";

async function fetchPublicResult(id: string): Promise<GalleryItem> {
  const res = await fetch(`/api/r/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("This creation is not available or has been made private.");
    throw new Error("Failed to load");
  }
  return res.json();
}

interface PublicResultViewProps {
  id: string;
}

export function PublicResultView({ id }: PublicResultViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-result", id],
    queryFn: () => fetchPublicResult(id),
  });

  const Icon = data ? (TASK_ICONS[data.taskType] ?? Globe) : Globe;
  const label = data ? (TASK_LABELS[data.taskType] ?? data.taskType) : "";
  const item = data ? fromGalleryItem(data) : null;

  return (
    <PageContainer maxWidth="4xl">
      <BackButton href="/gallery" label="Back to Gallery" />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <Globe className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button variant="outline" asChild>
            <Link href="/gallery">Browse Gallery</Link>
          </Button>
        </div>
      )}

      {data && item && (
        <>
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
                <Badge variant="outline">{data.model.split("/").pop()}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                by {shortAddr(data.userAddress)} &middot;{" "}
                {new Date(data.createdAt).toLocaleDateString()}
                {data.predictTimeMs && (
                  <> &middot; {(data.predictTimeMs / 1000).toFixed(1)}s</>
                )}
              </p>
            </div>
          </div>

          <OutputView
            item={item}
            variant="card"
            showPrompt
            showActions
          />

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Want to create something like this?
            </p>
            <Button asChild>
              <Link href={`/inference/${data.taskType}`}>
                Try {label}
              </Link>
            </Button>
          </div>
        </>
      )}
    </PageContainer>
  );
}
