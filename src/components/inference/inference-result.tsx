"use client";

import { useState } from "react";
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
import { Copy, Check, ExternalLink } from "lucide-react";

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
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
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
    <div className="flex flex-col gap-3">
      {outputType === "text" && <TextResult output={response.output} />}
      {outputType === "image" && <ImageResult output={response.output} />}
      {outputType === "audio" && <AudioResult output={response.output} />}

      {/* Share actions + metrics footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {inferenceId ? (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={isPublic}
                disabled={shareMutation.isPending}
                onCheckedChange={() => handleToggleShare()}
                aria-label="Share to public gallery"
              />
              <span className="text-xs text-muted-foreground select-none">
                Public
              </span>
            </label>
            {isPublic && publicUrl && (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  {linkCopied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {linkCopied ? "Copied" : "Copy Link"}
                </Button>
                <Button variant="ghost" size="sm" asChild>
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
          <div className="text-xs text-muted-foreground text-right space-y-0.5">
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
