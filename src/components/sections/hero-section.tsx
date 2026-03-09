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
    <section className="relative overflow-hidden pb-24 pt-20 sm:pb-28 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-25" />
      <div className="pointer-events-none absolute left-[-8%] top-18 h-72 w-72 rounded-full bg-primary/18 blur-3xl" />
      <div className="pointer-events-none absolute right-[-5%] top-12 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-background via-background/75 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full border border-border/70 bg-background/80 px-4 py-1.5 shadow-sm backdrop-blur"
            >
              <Sparkles className="size-3" />
              Powered by x402 Protocol
            </Badge>
          </div>

          <h1 className="text-5xl font-black tracking-[-0.05em] text-balance sm:text-7xl lg:text-[5.5rem]">
            Wallet-authenticated AI,
            <span className="mt-2 block bg-linear-to-r from-foreground via-primary to-chart-2 bg-clip-text text-transparent">
              priced one run at a time.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Generate images, text, and audio with live Replicate models. Sign in
            with your wallet, authorize x402 payment, and settle in USDC on Base
            before compute starts.
          </p>

          <div className="mt-12 flex items-center justify-center gap-4">
            <Button size="lg" className="h-12 rounded-full px-7 shadow-[0_20px_45px_-24px_var(--primary)]" asChild>
              <Link href="/inference">
                Open Inference Studio
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-border/80 bg-background/70 px-7 backdrop-blur"
              asChild
            >
              <Link href="/templates">
                Explore Prompt Templates
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/inference/text-to-image">
              <Badge
                variant="outline"
                className="cursor-pointer gap-2 rounded-full border-border/70 bg-background/70 px-4 py-2.5 text-sm shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
              >
                <ImagePlus className="size-4" />
                Text to Image
              </Badge>
            </Link>
            <Link href="/inference/text-to-text">
              <Badge
                variant="outline"
                className="cursor-pointer gap-2 rounded-full border-border/70 bg-background/70 px-4 py-2.5 text-sm shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
              >
                <MessageSquareText className="size-4" />
                Text to Text
              </Badge>
            </Link>
            <Link href="/inference/text-to-sound">
              <Badge
                variant="outline"
                className="cursor-pointer gap-2 rounded-full border-border/70 bg-background/70 px-4 py-2.5 text-sm shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
              >
                <AudioLines className="size-4" />
                Text to Sound
              </Badge>
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
            <div className="rounded-3xl border border-border/70 bg-background/72 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Settlement
              </p>
              <p className="mt-2 text-sm text-foreground">
                x402 verification and payment settlement happen before compute.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/72 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Networks
              </p>
              <p className="mt-2 text-sm text-foreground">
                USDC on Base with wallet-native auth and payment receipts.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/72 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Outputs
              </p>
              <p className="mt-2 text-sm text-foreground">
                Text is stored directly; media is persisted to R2 with stable URLs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
