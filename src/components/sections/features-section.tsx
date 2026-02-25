import {
  Coins,
  KeyRound,
  Layers,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    icon: Coins,
    title: "Micropayments",
    description:
      "Pay fractions of a cent per request. No minimums, no monthly fees, no wasted credits.",
  },
  {
    icon: KeyRound,
    title: "No API Keys",
    description:
      "Your wallet is your identity. No sign-ups, no dashboards, no rate-limit emails.",
  },
  {
    icon: Layers,
    title: "Multi-Model",
    description:
      "Access GPT, Claude, and open-source models through a single unified API.",
  },
  {
    icon: ShieldCheck,
    title: "On-Chain Verification",
    description:
      "Every payment is recorded on-chain. Fully transparent and auditable by anyone.",
  },
  {
    icon: Globe,
    title: "Open Standard",
    description:
      "Built on the x402 protocol — no vendor lock-in, works with any compliant provider.",
  },
  {
    icon: Zap,
    title: "Base L2",
    description:
      "Transactions settle on Base for sub-cent gas fees and near-instant finality.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-muted/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Why web3-ai?"
          subtitle="AI inference should be open, affordable, and verifiable."
        />
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
