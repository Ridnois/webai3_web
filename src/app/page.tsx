import { HeroSection } from "@/components/sections/hero-section";
import { ShowcaseSection } from "@/components/sections/showcase-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { TemplatesSection } from "@/components/sections/templates-section";
import { CtaSection } from "@/components/sections/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ShowcaseSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <TemplatesSection />
      <CtaSection />
    </>
  );
}
