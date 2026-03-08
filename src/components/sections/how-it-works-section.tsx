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
    title: "Sign in with Wallet",
    description:
      "Authenticate via SIWE (EIP-4361). No email/password accounts or API key provisioning required.",
  },
  {
    icon: MousePointerClick,
    title: "Request Cost + Model Run",
    description:
      "Choose a model and prompt. The API returns a 402 payment requirement with the estimated USDC amount.",
  },
  {
    icon: DollarSign,
    title: "Authorize USDC Transfer",
    description:
      "Sign an EIP-3009 transferWithAuthorization payload. The x402 facilitator handles on-chain settlement on Base.",
  },
  {
    icon: Sparkles,
    title: "Get Your Result",
    description:
      "Payment settles before compute starts. Receive your result plus a payment receipt hash, then keep it private or share it publicly.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="How it Works"
          subtitle="The x402 flow from authentication to on-chain settlement."
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
