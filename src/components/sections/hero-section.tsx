"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            Powered by x402 Protocol
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl whitespace-pre-line">
            {"Pay-Per-Use AI.\nNo Subscriptions. No API Keys."}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Connect your Web3 wallet, send a micropayment in USDC, and get AI
            inference results instantly. Powered by x402 — the open standard for
            internet-native payments.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
