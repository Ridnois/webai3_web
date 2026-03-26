"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { WalletButton } from "@/components/wallet/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
