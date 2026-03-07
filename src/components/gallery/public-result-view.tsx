"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TextResult } from "@/components/inference/text-result";
import { ImageResult } from "@/components/inference/image-result";
import { AudioResult } from "@/components/inference/audio-result";
import {
  ArrowLeft,
  ImagePlus,
  MessageSquareText,
  AudioLines,
  Globe,
} from "lucide-react";
import type { GalleryItem } from "@/hooks/use-gallery";

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

  const Icon = data ? (TASK_ICONS[data.taskType] ?? MessageSquareText) : Globe;
  const label = data ? (TASK_LABELS[data.taskType] ?? data.taskType) : "";

  // Build the output for result components
  const output = data?.outputType === "text"
    ? data.outputData
    : data?.mediaUrls && data.mediaUrls.length === 1
      ? data.mediaUrls[0]
      : data?.mediaUrls;

  const prompt =
    data && typeof data.input?.prompt === "string"
      ? data.input.prompt
      : null;

  const shortAddress = data
    ? `${data.userAddress.slice(0, 6)}...${data.userAddress.slice(-4)}`
    : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/gallery">
            <ArrowLeft className="size-4" />
            Back to Gallery
          </Link>
        </Button>
      </div>

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

      {data && (
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
                by {shortAddress} &middot;{" "}
                {new Date(data.createdAt).toLocaleDateString()}
                {data.predictTimeMs && (
                  <> &middot; {(data.predictTimeMs / 1000).toFixed(1)}s</>
                )}
              </p>
            </div>
          </div>

          {/* Prompt */}
          {prompt && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Prompt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{prompt}</p>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.outputType === "text" && <TextResult output={output} />}
              {data.outputType === "image" && <ImageResult output={output} />}
              {data.outputType === "audio" && <AudioResult output={output} />}
            </CardContent>
          </Card>

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
    </div>
  );
}
