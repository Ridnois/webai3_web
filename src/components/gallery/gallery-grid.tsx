"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useGallery } from "@/hooks/use-gallery";
import type { GalleryItem } from "@/hooks/use-gallery";

const TASK_ICONS: Record<string, typeof ImagePlus> = {
  "text-to-image": ImagePlus,
  "text-to-text": MessageSquareText,
  "text-to-sound": AudioLines,
};

const TASK_LABELS: Record<string, string> = {
  "text-to-image": "Image",
  "text-to-text": "Text",
  "text-to-sound": "Audio",
};

function GalleryCard({ item }: { item: GalleryItem }) {
  const Icon = TASK_ICONS[item.taskType] ?? MessageSquareText;
  const prompt =
    typeof item.input?.prompt === "string"
      ? item.input.prompt
      : JSON.stringify(item.input);

  const shortAddress = `${item.userAddress.slice(0, 6)}...${item.userAddress.slice(-4)}`;

  return (
    <Link href={`/r/${item.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
        {/* Image preview for image outputs */}
        {item.outputType === "image" && item.mediaUrls?.[0] && (
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={item.mediaUrls[0]}
              alt={prompt.slice(0, 100)}
              className="size-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Non-image preview */}
        {item.outputType !== "image" && (
          <div className="flex aspect-square items-center justify-center bg-muted/50">
            <Icon className="size-12 text-muted-foreground/30" />
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {TASK_LABELS[item.taskType] ?? item.taskType}
            </Badge>
            <span className="text-xs text-muted-foreground truncate">
              {item.model.split("/").pop()}
            </span>
          </div>
          <p className="text-sm line-clamp-2 text-muted-foreground">
            {prompt.slice(0, 120)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            by {shortAddress}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function GallerySkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export function GalleryGrid() {
  const [page, setPage] = useState(1);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const task = taskFilter === "all" ? undefined : taskFilter;
  const { data, isLoading } = useGallery(page, task);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Globe className="size-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Gallery
          </h1>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-lg text-muted-foreground">
          Explore AI-generated creations shared by the community.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <Tabs value={taskFilter} onValueChange={(v) => { setTaskFilter(v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="text-to-image">
              <ImagePlus className="size-4 mr-1.5" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text-to-text">
              <MessageSquareText className="size-4 mr-1.5" />
              Text
            </TabsTrigger>
            <TabsTrigger value="text-to-sound">
              <AudioLines className="size-4 mr-1.5" />
              Audio
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <GallerySkeleton key={i} />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Globe className="size-12 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No shared creations yet
          </p>
          <p className="text-xs text-muted-foreground/75">
            Be the first to share your AI generation with the community.
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.items.length < data.limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
