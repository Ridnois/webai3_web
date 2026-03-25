"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatUsdc } from "@/lib/pricing";
import { TASK_LABELS, STATUS_VARIANT } from "@/lib/output-constants";
import { TextResult } from "@/components/inference/text-result";
import { ImageResult } from "@/components/inference/image-result";
import { AudioResult } from "@/components/inference/audio-result";
import { OutputActions } from "@/components/output/output-actions";
import { ErrorAlert } from "@/components/ui/error-alert";
import { OutputLightbox } from "@/components/output/output-lightbox";
import { Badge } from "@/components/ui/badge";
import type { OutputItem } from "@/types/output-item";

type OutputViewVariant = "inline" | "card" | "detail";

interface OutputViewProps {
  item: OutputItem;
  variant?: OutputViewVariant;

  showPrompt?: boolean;
  showMetadata?: boolean;
  showActions?: boolean;

  // Owner capabilities
  isOwner?: boolean;
  onTogglePublic?: () => void;
  isToggling?: boolean;

  className?: string;
}

/**
 * Reconstruct the raw `output` value expected by the primitive renderers.
 * TextResult expects the raw text/array/object.
 * ImageResult/AudioResult expect a URL string or array.
 */
function rawOutput(item: OutputItem): unknown {
  if (item.outputType === "text") return item.textContent ?? "";
  if (item.mediaUrls.length === 1) return item.mediaUrls[0];
  return item.mediaUrls;
}

export function OutputView({
  item,
  variant = "inline",
  showPrompt = false,
  showMetadata = false,
  showActions = true,
  isOwner = false,
  onTogglePublic,
  isToggling = false,
  className,
}: OutputViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const output = rawOutput(item);
  const label = item.taskType ? TASK_LABELS[item.taskType] ?? item.taskType : null;

  // ── Error state ─────────────────────────────────────────────────────────────
  if (item.status === "failed" && item.errorMessage) {
    return (
      <ErrorAlert className={className}>{item.errorMessage}</ErrorAlert>
    );
  }

  // ── Inline variant ──────────────────────────────────────────────────────────
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {showPrompt && item.prompt && (
          <p className="text-sm text-muted-foreground italic line-clamp-3">{item.prompt}</p>
        )}

        {item.outputType === "text" && <TextResult output={output} />}
        {item.outputType === "image" && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="text-left cursor-pointer"
          >
            <ImageResult output={output} />
          </button>
        )}
        {item.outputType === "audio" && <AudioResult output={output} />}

        <div className="flex items-center justify-between gap-2 pt-1">
          {showActions ? (
            <OutputActions
              item={item}
              isOwner={isOwner}
              onTogglePublic={onTogglePublic}
              isToggling={isToggling}
              showFullscreen={item.outputType === "image"}
              onOpenFullscreen={() => setLightboxOpen(true)}
              showDownload={false}
            />
          ) : (
            <div />
          )}

          {showMetadata && item.predictTimeMs != null && (
            <div className="text-xs text-muted-foreground text-right space-y-0.5">
              <p>
                {(item.predictTimeMs / 1000).toFixed(1)}s
                {item.costUsdc != null && (
                  <span className="ml-1.5">{formatUsdc(item.costUsdc)}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {lightboxOpen && (
          <OutputLightbox
            item={item}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
            isOwner={isOwner}
            onTogglePublic={onTogglePublic}
            isToggling={isToggling}
          />
        )}
      </div>
    );
  }

  // ── Card variant ────────────────────────────────────────────────────────────
  if (variant === "card") {
    return (
      <div className={cn("space-y-5", className)}>
        {/* Prompt */}
        {showPrompt && item.prompt && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Prompt
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.prompt}</p>
          </div>
        )}

        {/* Result */}
        <div>
          {item.outputType === "text" && <TextResult output={output} />}
          {item.outputType === "image" && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="w-full text-left cursor-pointer"
            >
              <ImageResult output={output} />
            </button>
          )}
          {item.outputType === "audio" && <AudioResult output={output} />}
        </div>

        {/* Actions + metadata */}
        {(showActions || showMetadata) && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {showActions && (
              <OutputActions
                item={item}
                isOwner={isOwner}
                onTogglePublic={onTogglePublic}
                isToggling={isToggling}
                showFullscreen={item.outputType === "image"}
                onOpenFullscreen={() => setLightboxOpen(true)}
              />
            )}
            {showMetadata && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {label && <span>{label}</span>}
                {item.model && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {item.model.split("/").pop()}
                  </Badge>
                )}
                {item.predictTimeMs != null && (
                  <span>{(item.predictTimeMs / 1000).toFixed(1)}s</span>
                )}
              </div>
            )}
          </div>
        )}

        {lightboxOpen && (
          <OutputLightbox
            item={item}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
            isOwner={isOwner}
            onTogglePublic={onTogglePublic}
            isToggling={isToggling}
          />
        )}
      </div>
    );
  }

  // ── Detail variant ──────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          {item.model && (
            <h2 className="text-xl font-bold tracking-tight">{item.model}</h2>
          )}
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            {item.createdAt && (
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            )}
            {item.predictTimeMs != null && (
              <span>· {(item.predictTimeMs / 1000).toFixed(1)}s</span>
            )}
            {item.costUsdc != null && (
              <span>· {formatUsdc(item.costUsdc)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showActions && (
            <OutputActions
              item={item}
              isOwner={isOwner}
              onTogglePublic={onTogglePublic}
              isToggling={isToggling}
              showFullscreen={item.outputType === "image"}
              onOpenFullscreen={() => setLightboxOpen(true)}
            />
          )}
          {item.status && (
            <Badge variant={STATUS_VARIANT[item.status] ?? "secondary"}>
              {item.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Prompt */}
      {showPrompt && item.prompt && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Prompt
          </p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.prompt}</p>
        </div>
      )}

      {/* Result */}
      <div>
        {item.outputType === "text" && <TextResult output={output} />}
        {item.outputType === "image" && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full text-left cursor-pointer"
          >
            <ImageResult output={output} />
          </button>
        )}
        {item.outputType === "audio" && <AudioResult output={output} />}
      </div>

      {lightboxOpen && (
        <OutputLightbox
          item={item}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          isOwner={isOwner}
          onTogglePublic={onTogglePublic}
          isToggling={isToggling}
        />
      )}
    </div>
  );
}
