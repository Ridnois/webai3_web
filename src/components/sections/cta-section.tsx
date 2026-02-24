import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section className="bg-primary py-24 text-primary-foreground sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            {t("subtitle")}
          </p>
          <div className="mt-10">
            <Button size="lg" variant="secondary">
              {t("button")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
