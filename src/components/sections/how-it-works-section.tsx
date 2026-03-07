import { SectionHeading } from "@/components/section-heading";
import {
  Wallet,
  MousePointerClick,
  DollarSign,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description:
      "Sign in with your Ethereum wallet. No accounts, no passwords, no sign-up forms.",
  },
  {
    icon: MousePointerClick,
    title: "Pick a Model & Prompt",
    description:
      "Choose from top AI models on Replicate. Use a template or write your own prompt.",
  },
  {
    icon: DollarSign,
    title: "Sign a USDC Payment",
    description:
      "Approve a micropayment in your wallet. No gas fees to worry about on Base L2.",
  },
  {
    icon: Sparkles,
    title: "Get Your Result",
    description:
      "Payment settles on-chain, your AI result arrives instantly. Share it or keep it private.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="How it Works"
          subtitle="From wallet to AI result in four steps."
        />
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Connector line (hidden on first item and mobile) */}
                {i > 0 && (
                  <div className="pointer-events-none absolute -left-4 top-7 hidden h-px w-8 bg-border lg:block" />
                )}
                <div className="relative mb-5">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Icon className="size-6" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-background text-xs font-bold border">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
