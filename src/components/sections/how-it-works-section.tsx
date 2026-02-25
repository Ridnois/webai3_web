import { SectionHeading } from "@/components/section-heading";
import { StepCard } from "@/components/step-card";

const steps = [
  {
    title: "Connect Wallet",
    description:
      "Link your Web3 wallet in one click. No sign-ups, no accounts — your wallet is your identity.",
  },
  {
    title: "Choose a Model",
    description:
      "Pick the AI model that fits your task — GPT, Claude, open-source models, and more.",
  },
  {
    title: "Pay & Receive",
    description:
      "A USDC micropayment settles instantly on Base L2. Get your inference result in the same response.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="How it Works"
          subtitle="Three simple steps from wallet to AI results."
        />
        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {steps.map((step, i) => (
            <StepCard
              key={i}
              step={i + 1}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
