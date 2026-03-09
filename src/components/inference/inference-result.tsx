"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { InferenceResponse } from "@/types/inference";
import type { OutputType } from "@/types/task-config";
import { formatUsdc } from "@/lib/pricing";
import { useShareInference } from "@/hooks/use-share-inference";
import { toastSuccess, toastError } from "@/lib/toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TextResult } from "./text-result";
import { ImageResult } from "./image-result";
import { AudioResult } from "./audio-result";

interface InferenceResultProps {
  response: InferenceResponse;
  outputType: OutputType;
}

export function InferenceResult({
  response,
  outputType,
}: InferenceResultProps) {
  const shareMutation = useShareInference();
  const [isPublic, setIsPublic] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (response.error) {
    return (
      <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {response.error}
      </div>
    );
  }

  const inferenceId = response.id;
  const publicUrl =
    inferenceId && typeof window !== "undefined"
      ? `${window.location.origin}/r/${inferenceId}`
      : null;

  function handleToggleShare() {
    if (!inferenceId) return;
    const newPublic = !isPublic;
    shareMutation.mutate(
      { id: inferenceId, isPublic: newPublic },
      {
        onSuccess: (result) => {
          setIsPublic(result.isPublic);
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

  function handleCopyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setLinkCopied(true);
      toastSuccess("Link copied", "Public permalink is ready to share.");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {outputType === "text" && <TextResult output={response.output} />}
      {outputType === "image" && <ImageResult output={response.output} />}
      {outputType === "audio" && <AudioResult output={response.output} />}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/70 bg-background/72 p-4 shadow-sm">
        {inferenceId ? (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-3 py-2">
              <Checkbox
                checked={isPublic}
                disabled={shareMutation.isPending}
                onCheckedChange={() => handleToggleShare()}
                aria-label="Share to public gallery"
              />
              <span className="select-none text-xs font-medium text-muted-foreground">
                Public result
              </span>
            </label>
            {isPublic && publicUrl && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {linkCopied ? "Copied" : "Copy Link"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        {response.metrics?.predictTimeMs && (
          <div className="space-y-0.5 text-right text-xs text-muted-foreground">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Run metrics
            </p>
            <p>
              {(response.metrics.predictTimeMs / 1000).toFixed(1)}s
              {response.metrics.actualCostUsdc !== undefined && (
                <span className="ml-1.5">
                  {formatUsdc(response.metrics.actualCostUsdc)}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
