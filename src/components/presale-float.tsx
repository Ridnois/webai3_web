"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "https://webai3.app";
const DISMISS_KEY = "aic_promo_dismissed_until";
const DISMISS_DAYS = 3;
const SHOW_DELAY_MS = 3500;

const ALLOWED_PATHS = ["/dashboard", "/inference", "/"];

export function PresaleFloat() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  const isAllowed =
    isConnected && ALLOWED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    setMounted(true);
    if (!isAllowed) return;

    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAllowed]);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
      );
    }, 260);
  }

  if (!mounted || !visible || !isAllowed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 sm:right-6 sm:bottom-6",
        exiting ? "animate-presale-out" : "animate-presale-in",
      )}
    >
      <a
        href={LANDING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="aic-promo group flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200 hover:scale-[1.02]"
      >
        <p className="text-xs font-medium text-foreground leading-snug">
          Save on inference with{" "}
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            AIC
          </span>
        </p>

        <span className="shrink-0 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all group-hover:brightness-110">
          Get AIC
        </span>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:text-foreground hover:bg-foreground/10"
        >
          <X className="size-3" />
        </button>
      </a>
    </div>
  );
}
