"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useShareInference } from "@/hooks/use-share-inference";
import { toastSuccess, toastError } from "@/lib/toast";
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  succeeded: "default",
  pending: "secondary",
  failed: "destructive",
};

interface InferenceHistoryCardProps {
  item: InferenceHistoryItem;
}

export function InferenceHistoryCard({ item }: InferenceHistoryCardProps) {
  const Icon = TASK_ICONS[item.taskType] ?? MessageSquareText;
  const label = TASK_LABELS[item.taskType] ?? item.taskType;
  const variant = STATUS_VARIANT[item.status] ?? "secondary";
  const shareMutation = useShareInference();
  const isPublic = item.isPublic === 1;
  const canShare = item.status === "succeeded";

  const timeAgo = formatTimeAgo(new Date(item.createdAt));

  function handleToggleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    shareMutation.mutate(
      { id: item.id, isPublic: !isPublic },
      {
        onSuccess: (result) => {
          toastSuccess(
            result.isPublic ? "Shared to gallery" : "Removed from gallery",
            result.isPublic
              ? "Anyone with the link can now view this result."
              : "This result is now private and hidden from the gallery."
          );
        },
        onError: (err) => {
          toastError("Sharing failed", {
            description: err.message,
            hint: "Check your connection and try again.",
          });
        },
      }
    );
  }

  return (
    <Link href={`/history/${item.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{label}</p>
              <Badge variant={variant} className="shrink-0 text-xs">
                {item.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {item.model}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {canShare && (
              <label
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isPublic}
                  disabled={shareMutation.isPending}
                  onCheckedChange={() => handleToggleShare}
                  onClick={handleToggleShare}
                  aria-label="Make public"
                />
                <span className="text-xs text-muted-foreground select-none">
                  Public
                </span>
              </label>
            )}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
              {item.predictTimeMs && (
                <p className="text-xs text-muted-foreground">
                  {(item.predictTimeMs / 1000).toFixed(1)}s
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
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
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
