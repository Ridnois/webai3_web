"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { WalletButton } from "@/components/wallet/wallet-button";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const mainNav = [
  { href: "/inference", label: "Inference" },
  { href: "/templates", label: "Templates" },
  { href: "/gallery", label: "Gallery" },
];

const authNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
];

export function SiteHeader() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between rounded-[1.6rem] border border-border/70 bg-background/75 px-4 shadow-[0_18px_60px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-5">
        <Logo />

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 rounded-full border border-border/70 bg-muted/55 p-1 md:flex"
          aria-label="Main"
        >
          {mainNav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated &&
            authNav.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          <SignInButton />
          <WalletButton />

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-l-border/70 bg-background/95">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 pt-6" aria-label="Mobile">
                {mainNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border/70 hover:bg-muted/70 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
                {isAuthenticated &&
                  authNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border/70 hover:bg-muted/70 hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border/70 hover:bg-muted/70 hover:text-foreground"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        </div>
      </div>
    </header>
  );
}
