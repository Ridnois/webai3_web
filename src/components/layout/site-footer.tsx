import Link from "next/link";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-border/70 bg-background/70 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              Wallet-authenticated AI inference with x402 payments, Base settlement,
              and permanent media delivery.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold tracking-[0.16em] uppercase text-muted-foreground">Product</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/inference" className="text-sm text-muted-foreground hover:text-foreground">
                  Inference
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-sm text-muted-foreground hover:text-foreground">
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold tracking-[0.16em] uppercase text-muted-foreground">Explore</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="https://www.x402.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                  x402 Protocol
                </a>
              </li>
              <li>
                <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                  Base L2
                </a>
              </li>
              <li>
                <a href="https://replicate.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                  Replicate
                </a>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold tracking-[0.16em] uppercase text-muted-foreground">Account</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground">
                  History
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <p className="text-center text-sm text-muted-foreground">
          &copy; {year} web3-ai. Pay per run, settle before compute.
        </p>
      </div>
    </footer>
  );
}
