import Link from "next/link";
import { ArrowRight } from "lucide-react";

const tasks = [
  {
    label: "text-to-image",
    href: "/inference/text-to-image",
    avgSec: 10,
    cost: "0.0100",
    models: ["flux-schnell", "sdxl", "flux-pro"],
    note: "resolution affects runtime",
  },
  {
    label: "text-to-text",
    href: "/inference/text-to-text",
    avgSec: 3,
    cost: "0.0030",
    models: ["llama-3-70b", "mixtral-8x7b", "gemma"],
    note: "billed per output token batch",
  },
  {
    label: "text-to-sound",
    href: "/inference/text-to-sound",
    avgSec: 15,
    cost: "0.0150",
    models: ["stable-audio", "minimax-music"],
    note: "duration scales with prompt length",
  },
];

const perks = [
  { key: "billing",   value: "per-second",     desc: "billed at $0.001 USDC / sec of compute" },
  { key: "minimum",   value: "none",            desc: "no minimum balance, no monthly floor" },
  { key: "estimate",  value: "pre-flight",      desc: "cost shown before you sign anything" },
  { key: "receipt",   value: "on-chain",        desc: "every run includes a settlement tx hash" },
  { key: "storage",   value: "permanent",       desc: "outputs stored in R2, no expiry" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 flex items-baseline gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/60">Pricing</span>
          <div className="h-px flex-1 bg-border/40" />
          <span className="font-mono text-[10px] text-muted-foreground/40">USDC · on-chain settlement</span>
        </div>

        {/* Rate formula */}
        <div className="mb-10 inline-flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5">
          <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">rate</span>
          <span className="font-mono text-sm text-foreground">
            cost = runtime<span className="text-muted-foreground/50">_seconds</span> × <span className="text-primary">$0.001</span> USDC
          </span>
        </div>

        {/* Task table */}
        <div className="mb-12 overflow-hidden rounded-lg border border-border/40">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-0 border-b border-border/40 bg-muted/20 px-4 py-2.5">
            {["task", "avg time", "est. cost", "models"].map((h) => (
              <span key={h} className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                {h}
              </span>
            ))}
          </div>

          {tasks.map((t, i) => (
            <Link
              key={t.label}
              href={t.href}
              className={[
                "group grid grid-cols-[2fr_1fr_1fr_2fr] gap-0 px-4 py-4 transition-colors hover:bg-muted/30",
                i < tasks.length - 1 ? "border-b border-border/30" : "",
              ].join(" ")}
            >
              {/* Task name */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {t.label}
                </span>
                <ArrowRight className="size-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              {/* Avg time */}
              <div className="flex items-center">
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  ~{t.avgSec}s
                </span>
              </div>

              {/* Cost */}
              <div className="flex items-center">
                <span className="font-mono text-sm tabular-nums font-semibold text-foreground">
                  ${t.cost}
                </span>
              </div>

              {/* Models + note */}
              <div className="flex flex-col justify-center gap-0.5 min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  {t.models.map((m) => (
                    <span
                      key={m}
                      className="font-mono text-[10px] text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded border border-border/30"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[9px] text-muted-foreground/35 mt-0.5">{t.note}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Perks — inline key-value */}
        <div className="grid gap-0 divide-y divide-border/30 rounded-lg border border-border/40 overflow-hidden sm:grid-cols-1">
          {perks.map((p) => (
            <div key={p.key} className="flex items-baseline gap-4 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40 w-20 shrink-0">
                {p.key}
              </span>
              <span className="font-mono text-xs font-semibold text-primary/80 w-24 shrink-0">
                {p.value}
              </span>
              <span className="text-xs text-muted-foreground/60">{p.desc}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
