import { useTranslations } from "next-intl";
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

const featureIcons = [Coins, KeyRound, Layers, ShieldCheck, Globe, Zap];

export function FeaturesSection() {
  const t = useTranslations("features");

  const indices = [0, 1, 2, 3, 4, 5] as const;

  return (
    <section id="features" className="bg-muted/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {indices.map((i) => (
            <FeatureCard
              key={i}
              icon={featureIcons[i]}
              title={t(`items.${i}.title`)}
              description={t(`items.${i}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
