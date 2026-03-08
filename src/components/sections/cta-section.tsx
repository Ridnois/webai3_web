"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-12 sm:p-20">
          {/* Subtle background pattern */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30" />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Ready to run your first paid inference?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              No sign-up required. Connect your wallet, choose a model, and
              run a USDC-settled inference with an on-chain payment receipt.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/inference">
                  Start Creating
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/gallery">
                  <Globe className="size-4" />
                  Explore Gallery
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
