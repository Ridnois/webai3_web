import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            {t("badge")}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl whitespace-pre-line">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg">{t("ctaPrimary")}</Button>
            <Button variant="outline" size="lg">
              {t("ctaSecondary")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
