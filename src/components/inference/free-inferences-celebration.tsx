"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FreeInferencesCelebrationProps {
  creditAmount: number;
  onClose: () => void;
  isOpen: boolean;
}

export function FreeInferencesCelebration({ creditAmount, onClose, isOpen }: FreeInferencesCelebrationProps) {
  useEffect(() => {
    if (!isOpen) return;

    const duration = 3200;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        ticks: 180,
        scalar: 0.9,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
    const timeout = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeout);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-primary/30 bg-gradient-to-b from-background via-background to-primary/5 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" />
            <DialogTitle>Free inferences unlocked</DialogTitle>
          </div>
          <DialogDescription>
            You just claimed {creditAmount} free inferences. Give your first one a try — on us.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/20 bg-background/80 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What you get</p>
          <ul className="mt-2 space-y-1">
            <li>• {creditAmount} inference runs at no cost</li>
            <li>• Applies automatically before any payment</li>
            <li>• Keep exploring — credit is tracked in your wallet</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="flex-1 min-w-[140px]">
            <Link href="/inference" onClick={onClose}>
              Start inferencing
            </Link>
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
