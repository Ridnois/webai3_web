"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const steps = [
  { id: "siwe",  label: "SIWE",     sub: "EIP-4361",              color: "#60a5fa" },
  { id: "req",   label: "HTTP 402", sub: "Payment-Required",      color: "#fbbf24" },
  { id: "sign",  label: "EIP-3009", sub: "transferWithAuth",      color: "#34d399" },
  { id: "run",   label: "RESULT",   sub: "Replicate · R2",        color: "#a78bfa" },
] as const;

const DURATION = 2200;

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  function advance(i?: number) {
    const next = i !== undefined ? i : (active + 1) % steps.length;
    setActive(next);
    setProgress(0);
    setAnimKey((k) => k + 1);
    startRef.current = null;
  }

  useEffect(() => {
    function tick(ts: number) {
      if (pausedRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setActive((prev) => {
          const next = (prev + 1) % steps.length;
          setAnimKey((k) => k + 1);
          return next;
        });
        setProgress(0);
        startRef.current = null;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const step = steps[active];

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-border/60 py-16 sm:py-24"
    >
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] animate-pulse-glow transition-all duration-700"
          style={{ background: `${step.color}18` }}
        />
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.07]" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Label */}
        <div className="mb-10 flex items-center gap-3">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-500"
            style={{ color: step.color }}
          >
            Protocol flow
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {/* Flow nodes */}
        <div className="relative flex items-center justify-between gap-0">

          {steps.map((s, i) => {
            const isActive = active === i;
            const isPast = i < active;

            return (
              <div key={s.id} className="flex flex-1 items-center">

                {/* Node */}
                <button
                  type="button"
                  onClick={() => { advance(i); }}
                  className="group relative flex flex-col items-center gap-2.5 focus:outline-none"
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      "relative flex size-12 sm:size-14 items-center justify-center rounded-full border transition-all duration-500",
                      isActive ? "scale-110" : "scale-100",
                    )}
                    style={{
                      borderColor: isActive ? s.color : isPast ? `${s.color}50` : "var(--border)",
                      background: isActive ? `${s.color}18` : isPast ? `${s.color}08` : "var(--card)",
                      boxShadow: isActive ? `0 0 24px -4px ${s.color}60` : "none",
                    }}
                  >
                    {/* Ring pulse on active */}
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ background: s.color }}
                      />
                    )}
                    {/* Step number */}
                    <span
                      className="font-mono text-xs font-bold tabular-nums transition-colors duration-500"
                      style={{ color: isActive ? s.color : isPast ? `${s.color}80` : "var(--muted-foreground)" }}
                    >
                      0{i + 1}
                    </span>
                  </div>

                  {/* Labels */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest transition-colors duration-500",
                      )}
                      style={{ color: isActive ? s.color : isPast ? `${s.color}80` : "var(--muted-foreground)" }}
                    >
                      {s.label}
                    </span>
                    <span className="font-mono text-[8px] sm:text-[9px] text-muted-foreground/40 text-center leading-tight max-w-[80px]">
                      {s.sub}
                    </span>
                  </div>
                </button>

                {/* Connector (not after last) */}
                {i < steps.length - 1 && (
                  <div className="relative flex-1 h-px mx-2 sm:mx-3">
                    {/* Base line */}
                    <div className="absolute inset-0 bg-border/40 rounded-full" />

                    {/* Filled portion for past steps */}
                    {isPast && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{ width: "100%", background: `${steps[i].color}60` }}
                      />
                    )}

                    {/* Animated progress on active connector */}
                    {isActive && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-none"
                        style={{
                          width: `${progress * 100}%`,
                          background: `linear-gradient(to right, ${s.color}80, ${s.color})`,
                        }}
                      />
                    )}

                    {/* Traveling dot */}
                    {isActive && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 size-1.5 rounded-full -translate-x-1/2"
                        style={{
                          left: `${progress * 100}%`,
                          background: s.color,
                          boxShadow: `0 0 8px 2px ${s.color}80`,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-10 h-px w-full overflow-hidden rounded-full bg-border/30">
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${((active + progress) / steps.length) * 100}%`,
              background: `linear-gradient(to right, ${steps[0].color}60, ${step.color})`,
            }}
          />
        </div>

      </div>
    </section>
  );
}
