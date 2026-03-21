import { Suspense } from "react";
import { HomePromptBox } from "@/components/sections/home-prompt-box";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero / Composer ───────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center overflow-hidden px-4 pt-24 pb-20 sm:pt-32 sm:px-6 lg:px-8">

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/3 -top-16 size-[520px] -translate-x-1/2 rounded-full bg-primary/8 blur-[110px] animate-drift" />
          <div className="absolute right-1/3 top-10 size-[420px] translate-x-1/2 rounded-full bg-primary/5 blur-[90px] animate-drift delay-300" />
          <div className="absolute bottom-0 left-1/2 size-[360px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px] animate-pulse-glow delay-200" />
        </div>

        {/* Content */}
        <div className="relative w-full max-w-2xl">

          {/* Greeting */}
          <div className="animate-fade-in mb-10 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              What will you create?
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              AI inference, paid per request. On-chain settlement with USDC via x402.
            </p>
          </div>

          {/* Prompt composer */}
          <div className="animate-fade-in-up delay-100">
            <HomePromptBox />
          </div>

          {/* Info row */}
          <div className="animate-fade-in-up delay-200 mt-6 flex items-center justify-center gap-4">
            {["USDC on-chain", "x402 settlement", "Replicate models", "No subscription"].map((item) => (
              <span key={item} className="text-xs text-muted-foreground/50">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Gallery ─────────────────────────────────────────────── */}
      <section className="border-t border-border/60">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/50">
              Loading gallery…
            </div>
          }
        >
          <GalleryGrid />
        </Suspense>
      </section>

    </div>
  );
}
