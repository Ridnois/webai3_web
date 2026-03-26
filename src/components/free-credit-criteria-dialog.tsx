"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const ACCEPTANCE_POINTS = [
  "Wallet is connected and authenticated (SIWE)",
  "First time connecting this address",
  "USDC balance greater than 0 on the connected chain",
  "Grants are one-time and non-stacking",
  "Free runs are used before any paid charge",
];

export function FreeCreditCriteriaDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" />
            <DialogTitle>How the free inferences work</DialogTitle>
          </div>
          <DialogDescription>
            Eligibility and usage rules for the 5 free inferences offered to new wallets.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-muted-foreground">
          {ACCEPTANCE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="mt-1 inline-block size-1.5 rounded-full bg-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Note: Credits apply automatically on your next inference until all 5 are consumed.
        </div>

        <div className="flex justify-end">
          <Button variant="outline">Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
