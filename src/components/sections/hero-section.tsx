"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-40">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Sparkles className="size-3" />
              Powered by x402 Protocol
            </Badge>
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            AI that runs on
            <span className="block text-muted-foreground/60">micropayments</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Generate images, text, and audio with top models from Replicate.
            Authenticate with your wallet, authorize payment via x402, and pay
            per inference in USDC on Ethereum.
          </p>

          {/* Task pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/inference/text-to-image">
              <Badge variant="outline" className="gap-1.5 px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                <ImagePlus className="size-4" />
                Text to Image
              </Badge>
            </Link>
            <Link href="/inference/text-to-text">
              <Badge variant="outline" className="gap-1.5 px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                <MessageSquareText className="size-4" />
                Text to Text
              </Badge>
            </Link>
            <Link href="/inference/text-to-sound">
              <Badge variant="outline" className="gap-1.5 px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                <AudioLines className="size-4" />
                Text to Sound
              </Badge>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/inference">
                Start Creating
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/templates">
                Browse Templates
              </Link>
            </Button>
          </div>

          {/* Trust line */}
          <p className="mt-8 text-xs text-muted-foreground/60">
            USDC on Ethereum &middot; x402 settlement before compute &middot; On-chain receipts per inference
          </p>
        </div>
      </div>
    </section>
  );
}
