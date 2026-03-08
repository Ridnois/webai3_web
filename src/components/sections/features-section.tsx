import {
  Coins,
  KeyRound,
  Layers,
  ShieldCheck,
  Globe,
  Zap,
  Share2,
  Sparkles,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    icon: Coins,
    title: "True Pay-Per-Use",
    description:
      "No subscriptions, no credits, no minimums. Inference is billed in USDC based on execution time using the configured protocol rate.",
  },
  {
    icon: KeyRound,
    title: "Wallet is Your Identity",
    description:
      "No sign-ups, no API keys to manage. Connect your Web3 wallet and you're in. Sign-In With Ethereum keeps it simple.",
  },
  {
    icon: Layers,
    title: "Multi-Model Access",
    description:
      "Flux, Stable Diffusion, Llama, Mixtral, Stable Audio, and more. One interface for text, image, and audio models.",
  },
  {
    icon: ShieldCheck,
    title: "On-Chain Settlement",
    description:
      "Every payment is verified and settled on Base before your inference runs. Transparent, auditable, and trustless via x402.",
  },
  {
    icon: Share2,
    title: "Share & Discover",
    description:
      "Share your creations to the public gallery with one click. Browse what others have made and get inspired by the community.",
  },
  {
    icon: Sparkles,
    title: "Ready-Made Templates",
    description:
      "Don't know where to start? Pick from curated prompt templates across image, text, and audio — one click to get started.",
  },
  {
    icon: Globe,
    title: "Open Standard",
    description:
      "Built on x402 — the open payment protocol for the internet. No vendor lock-in, no walled gardens.",
  },
  {
    icon: Zap,
    title: "Built on Base",
    description:
      "Base mainnet + Base Sepolia support with optional local Anvil mode for development and integration testing.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-muted/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Everything you need, nothing you don't"
          subtitle="AI inference should be open, affordable, and verifiable."
        />
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FeatureCard
              key={i}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
