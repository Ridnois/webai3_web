import { Suspense } from "react";
import Link from "next/link";
import { Images, ArrowRight, Sparkles } from "lucide-react";
import { HomePromptBox } from "@/components/sections/home-prompt-box";
import { PlatformStatsBar } from "@/components/sections/platform-stats-bar";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { FreeCreditFloatHome } from "@/components/sections/free-credit-float-home";

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center overflow-hidden px-4 pt-14 pb-6 sm:pt-18 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-2xl text-center space-y-4">
          <div className="animate-fade-in flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-mono font-medium uppercase tracking-widest text-primary">
              <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
              Pay-per-use · On-chain receipts
            </span>
          </div>

          <div className="relative">
            <FreeCreditFloatHome />
            <h1 className="animate-fade-in-up delay-50 text-4xl font-black tracking-[-0.02em] text-foreground sm:text-5xl">
              Run an AI inference in seconds.
            </h1>
          </div>

          <p className="animate-fade-in-up delay-100 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Connect your wallet, pick a model, and get results. No accounts. No subscriptions.
          </p>

          <div className="animate-fade-in-up delay-150 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#try"
              className="brand-cta inline-flex h-11 items-center gap-2.5 rounded-full px-7 text-sm font-semibold tracking-wide transition-all duration-200"
            >
              <Sparkles className="size-4 shrink-0" />
              Try a prompt
            </Link>
            <Link
              href="/gallery"
              className="brand-ghost inline-flex h-11 items-center gap-2.5 rounded-full px-6 text-sm font-medium tracking-wide transition-all duration-200"
            >
              <Images className="size-4 shrink-0 opacity-70" />
              See gallery
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platform stats ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={null}>
            <PlatformStatsBar />
          </Suspense>
        </div>
      </section>

      {/* ── Prompt composer ───────────────────────────────────────────────── */}
      <section id="try" className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">

          {/* Section divider */}
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-primary/70">
              Try it
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          <HomePromptBox />
        </div>
      </section>

      {/* ── Protocol flow / How it works ─────────────────────────────────── */}
      <section className="border-t border-border/60 bg-card/40 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <HowItWorksSection />
        </div>
      </section>

      {/* ── Community gallery ─────────────────────────────────────────────── */}
      <section className="border-t border-border/60 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Section header */}
          <div className="mb-6 flex items-center gap-3">
            <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-primary/70">
              Community outputs
            </span>
            <div className="h-px flex-1 bg-border/50" />
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/20 hover:text-foreground hover:gap-2"
            >
              View all
              <ArrowRight className="size-3 shrink-0" />
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground/40">
                <span className="font-mono text-xs">Loading gallery…</span>
              </div>
            }
          >
            <GalleryGrid embedded />
          </Suspense>
        </div>
      </section>

    </div>
  );
}
