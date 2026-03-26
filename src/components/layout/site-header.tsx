"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Sparkles, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { WalletButton } from "@/components/wallet/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useFreeCreditStatus } from "@/hooks/use-free-credit-status";
import { useConnect } from "wagmi";
import { useAuth as useAuthHook } from "@/hooks/use-auth";
import { addAndSwitchToSepolia } from "@/lib/wallet-network";
import { defaultChain } from "@/lib/wagmi";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mainNav = [
  { href: "/inference/text-to-image", label: "Create" },
  { href: "/gallery", label: "Gallery" },
];

const authNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
];

function FreeCreditFloat() {
  const { isAuthenticated } = useAuthHook();
  const { status, isLoading } = useFreeCreditStatus();
  const { connectors, connectAsync, isPending } = useConnect();
  const { signIn } = useAuthHook();
  const [isBusy, setIsBusy] = useState(false);

  const quickConnector =
    connectors.find((c) => c.ready) ??
    connectors.find((c) => c.id === "injected") ??
    connectors[0];

  const show =
    !isLoading &&
    (!status || status.remainingCredit > 0) &&
    (!isAuthenticated || (status ? status.remainingCredit > 0 : true));

  async function handleClick() {
    if (!quickConnector) return;
    setIsBusy(true);
    try {
      const res = await connectAsync({ connector: quickConnector });
      if (res.chainId !== defaultChain.id && defaultChain.id === 11155111) {
        await addAndSwitchToSepolia();
      }
      await signIn();
    } catch (e) {
      console.error("[free-credit-float] connect failed", e);
    } finally {
      setIsBusy(false);
    }
  }

  if (!show) return null;

  return (
    <button
      onClick={handleClick}
      disabled={isBusy || isPending}
      className="group absolute -left-48 hidden items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 px-3 py-1.5 text-xs font-semibold text-primary shadow-[0_12px_32px_-18px] shadow-primary/40 transition hover:-translate-y-[1px] hover:shadow-[0_14px_32px_-16px] sm:flex"
      aria-label="Claim free inferences"
    >
      <Sparkles className="size-4 shrink-0" />
      <span className="whitespace-nowrap">
        {status?.remainingCredit ? `${status.remainingCredit} free left` : "Claim 5 free runs"}
      </span>
      <ArrowUpRight className="size-4 shrink-0 transition group-hover:translate-x-[1px]" />
      <span className="absolute -top-2 right-4 animate-pulse text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
        Now
      </span>
    </button>
  );
}

export function SiteHeader() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allNav = [
    ...mainNav,
    ...(isAuthenticated ? authNav : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center gap-2">
          <Logo />
          <span className="pointer-events-none select-none -rotate-3 bg-amber-300/85 px-2.5 py-[2px] text-[10px] font-black uppercase tracking-[0.14em] text-amber-950 shadow-[0_6px_18px_-10px_rgba(0,0,0,0.35)]">
            Beta
          </span>
        </div>

        <nav className="hidden items-center gap-5 md:flex" aria-label="Main">
          {allNav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="relative flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" />
          {mounted && <FreeCreditFloat />}
          <WalletButton />

          {mounted && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-60">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5 pt-6" aria-label="Mobile">
                  {allNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
