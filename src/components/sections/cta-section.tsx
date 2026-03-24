"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const lines = [
  { prefix: "$",  text: "webai3 run --model flux-schnell \\", delay: 0 },
  { prefix: " ",  text: '  --prompt "a neon city at night" \\', delay: 80 },
  { prefix: " ",  text: "  --pay usdc",                        delay: 160 },
  { prefix: "▶",  text: "estimating cost...",                  delay: 320 },
  { prefix: "▶",  text: "signing EIP-3009 payload...",         delay: 440 },
  { prefix: "✓",  text: "settled · tx: 0x1a2b3c4d",           delay: 580 },
  { prefix: "✓",  text: "inference complete · 9.8s · $0.010", delay: 680 },
] as const;

export function CtaSection() {
  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20 lg:items-center">

          {/* Left — terminal block */}
          <div className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden">
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-3">
              <span className="size-2.5 rounded-full bg-border/60" />
              <span className="size-2.5 rounded-full bg-border/60" />
              <span className="size-2.5 rounded-full bg-border/60" />
              <span className="ml-3 font-mono text-[10px] text-muted-foreground/40">
                webai3 · v0.1.0
              </span>
            </div>

            {/* Lines */}
            <div className="px-5 py-5 space-y-1.5">
              {lines.map((line, i) => {
                const isSuccess = line.prefix === "✓";
                const isProgress = line.prefix === "▶";
                const isCommand = line.prefix === "$" || line.prefix === " ";
                return (
                  <div
                    key={i}
                    className="flex items-baseline gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${line.delay}ms`, animationFillMode: "both" }}
                  >
                    <span className={[
                      "font-mono text-xs w-3 shrink-0 select-none",
                      isSuccess  ? "text-emerald-500/80" :
                      isProgress ? "text-primary/60" :
                                   "text-muted-foreground/40",
                    ].join(" ")}>
                      {line.prefix}
                    </span>
                    <span className={[
                      "font-mono text-xs leading-relaxed",
                      isSuccess  ? "text-emerald-400/80" :
                      isProgress ? "text-muted-foreground/60" :
                      isCommand  ? "text-foreground/80" :
                                   "text-foreground/60",
                    ].join(" ")}>
                      {line.text}
                    </span>
                  </div>
                );
              })}

              {/* Cursor */}
              <div className="flex items-center gap-3 pt-1">
                <span className="font-mono text-xs text-muted-foreground/40 w-3 select-none">$</span>
                <span className="inline-block w-2 h-3.5 bg-primary/70 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right — copy + CTAs */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/60 mb-3">
                Ready to run
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl leading-tight">
                First inference in under 60 seconds.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                No sign-up. No subscription. Connect a wallet, pick a model, sign one EIP-3009 payload.
                Your payment settles on-chain before compute starts — every run is auditable.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inference"
                className="brand-cta inline-flex h-10 items-center gap-2.5 rounded-full px-6 text-sm font-semibold tracking-wide transition-all duration-200"
              >
                Start creating
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/gallery"
                className="brand-ghost inline-flex h-10 items-center gap-2.5 rounded-full px-6 text-sm font-medium transition-all duration-200"
              >
                Explore gallery
              </Link>
            </div>

            {/* Protocol footnote */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-border/40">
              {["x402 protocol", "EIP-3009", "SIWE", "Replicate"].map((tag) => (
                <span key={tag} className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
