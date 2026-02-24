import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/section-heading";
import { StepCard } from "@/components/step-card";

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");

  const steps = [0, 1, 2] as const;

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />
        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {steps.map((i) => (
            <StepCard
              key={i}
              step={i + 1}
              title={t(`steps.${i}.title`)}
              description={t(`steps.${i}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
