"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  ExternalLink,
  Download,
  Maximize2,
} from "lucide-react";
import { toastSuccess } from "@/lib/toast";
import type { OutputItem } from "@/types/output-item";

interface OutputActionsProps {
  item: OutputItem;

  // Visibility (owner-only)
  isOwner?: boolean;
  onTogglePublic?: () => void;
  isToggling?: boolean;

  // Feature flags
  showDownload?: boolean;
  showCopyLink?: boolean;
  showFullscreen?: boolean;
  onOpenFullscreen?: () => void;

  className?: string;
}

export function OutputActions({
  item,
  isOwner = false,
  onTogglePublic,
  isToggling = false,
  showDownload = true,
  showCopyLink = true,
  showFullscreen = false,
  onOpenFullscreen,
  className = "",
}: OutputActionsProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const publicUrl =
    item.id && typeof window !== "undefined"
      ? `${window.location.origin}/r/${item.id}`
      : null;

  const downloadUrl = item.mediaUrls[0] ?? null;
  const isPublic = item.isPublic === true;

  function handleCopyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setLinkCopied(true);
      toastSuccess("Link copied", "Public permalink is ready to share.");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Visibility toggle (owner only) */}
      {isOwner && onTogglePublic && item.status === "succeeded" && (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={isPublic}
            disabled={isToggling}
            onCheckedChange={() => onTogglePublic()}
            aria-label="Share to public gallery"
          />
          <span className="text-xs text-muted-foreground select-none">
            Public
          </span>
        </label>
      )}

      {/* Copy permalink */}
      {showCopyLink && isPublic && publicUrl && (
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {linkCopied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {linkCopied ? "Copied" : "Copy Link"}
        </Button>
      )}

      {/* External link */}
      {isPublic && publicUrl && (
        <Button variant="ghost" size="sm" asChild>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      )}

      {/* Download */}
      {showDownload && downloadUrl && item.outputType !== "text" && (
        <Button variant="outline" size="sm" asChild>
          <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
            <Download className="size-3.5" />
            Download
          </a>
        </Button>
      )}

      {/* Fullscreen */}
      {showFullscreen && item.outputType === "image" && item.mediaUrls.length > 0 && (
        <Button variant="ghost" size="sm" onClick={onOpenFullscreen}>
          <Maximize2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
