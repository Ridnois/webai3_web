"use client";

import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { WalletButton } from "@/components/wallet/wallet-button";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { isAdmin, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          <NavLink href="#how-it-works">How it Works</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="/inference">Inference</NavLink>
          {isAuthenticated && <NavLink href="/dashboard">Dashboard</NavLink>}
          <NavLink href="/history">History</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-3">
          <SignInButton />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
