import { Suspense } from "react";
import Link from "next/link";
import { HomePromptBox } from "@/components/sections/home-prompt-box";
import { PlatformStatsBar } from "@/components/sections/platform-stats-bar";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero-grid relative flex flex-col items-center overflow-hidden px-4 pt-20 pb-10 sm:pt-28 sm:px-6 lg:px-8">

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/3 -top-20 size-[560px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px] animate-drift" />
          <div className="absolute right-1/4 top-0 size-[400px] translate-x-1/2 rounded-full bg-primary/8 blur-[100px] animate-drift" style={{ animationDuration: "12s", animationDelay: "0.3s" }} />
          <div className="absolute left-1/2 top-1/3 size-[320px] -translate-x-1/2 rounded-full bg-violet-500/6 blur-[100px] animate-drift" style={{ animationDuration: "7s", animationDelay: "1.5s" }} />
        </div>

        <div className="relative w-full max-w-2xl text-center">

          {/* Kicker badge */}
          <div className="animate-fade-in mb-6 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-[11px] font-mono font-medium uppercase tracking-widest text-primary">
              <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
              x402 protocol · ethereum mainnet
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-75 text-5xl font-black tracking-[-0.03em] text-foreground sm:text-6xl">
            Pay-per-use AI inference.
          </h1>

          {/* Description */}
          <p className="animate-fade-in-up delay-150 mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Connect wallet, pay per run in USDC via x402, get results on-chain.
            <br className="hidden sm:block" />
            No subscriptions. No accounts. Fully verifiable.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up delay-200 mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/inference/text-to-image"
              className="brand-cta inline-flex h-10 items-center gap-2 rounded-full px-6 text-sm font-medium transition-all duration-200"
            >
              Generate Image
              <span className="text-xs opacity-60">→</span>
            </Link>
            <Link
              href="/gallery"
              className="brand-ghost inline-flex h-10 items-center gap-2 rounded-full px-6 text-sm font-medium transition-all duration-200"
            >
              Browse Gallery
            </Link>
          </div>

          {/* Stat pills */}
          <div className="animate-fade-in-up delay-300 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              ["$0.001", "per second of compute"],
              ["USDC", "on-chain settlement"],
              ["EIP-3009", "transferWithAuthorization"],
            ].map(([value, label]) => (
              <div key={value} className="group flex items-baseline gap-1.5 cursor-default">
                <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
                <span className="text-xs text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">{label}</span>
              </div>
            ))}
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
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
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
              className="text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground/40">
                <span className="font-mono text-xs">Loading gallery…</span>
              </div>
            }
          >
            <GalleryGrid />
          </Suspense>
        </div>
      </section>

    </div>
  );
}
