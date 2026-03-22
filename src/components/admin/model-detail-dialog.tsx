"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModelDetailView } from "./model-detail-view";
import { ExternalLink } from "lucide-react";

interface ModelDetailDialogProps {
  model: string | null;
  onClose: () => void;
}

export function ModelDetailDialog({ model, onClose }: ModelDetailDialogProps) {
  const router = useRouter();

  function openFullPage() {
    if (!model) return;
    router.push(`/admin/model?model=${encodeURIComponent(model)}`);
  }

  return (
    <Dialog open={model !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/*
        Override shadcn defaults:
          - sm:max-w-4xl  → replaces sm:max-w-lg
          - flex flex-col → replaces grid (needed for sticky header + scroll body)
          - p-0 gap-0     → we handle padding per-section
          - max-h-[90dvh] overflow-hidden → constrain height, scroll inside
      */}
      <DialogContent className="sm:max-w-4xl flex flex-col p-0 gap-0 max-h-[90dvh] overflow-hidden">
        {/* Sticky header */}
        <div className="flex items-start gap-4 border-b border-border/60 px-6 py-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold">Inference Times</DialogTitle>
            <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
              {model}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-0.5 shrink-0 gap-1.5 text-xs"
            onClick={openFullPage}
          >
            <ExternalLink className="size-3.5" />
            Full page
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {model && <ModelDetailView model={model} compact />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
