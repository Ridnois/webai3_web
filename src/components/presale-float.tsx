"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "https://webai3.app";
const DISMISS_KEY = "presale_banner_dismissed_until";
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 3000;

export function PresaleFloat() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    }, 260);
  }

  if (!mounted || !visible) return null;

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", exiting ? "animate-presale-out" : "animate-presale-in")}>
      <a
        href={`${LANDING_URL}#presale`}
        target="_blank"
        rel="noopener noreferrer"
        className="glass flex items-center gap-3 rounded-full py-2 pl-3.5 pr-2 shadow-lg shadow-black/20 dark:shadow-black/40 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] group"
      >
        {/* Live dot */}
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          AIC presale · Phase 1 · <span className="text-primary font-semibold">$0.01</span>
        </span>

        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors group-hover:bg-primary/15">
          Invest
          <ArrowRight className="size-3" />
        </span>

        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </a>
    </div>
  );
}
