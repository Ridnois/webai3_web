import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold">{t("product")}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("productLinks.howItWorks")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("productLinks.pricing")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("productLinks.models")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("productLinks.docs")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("developers")}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("developerLinks.api")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("developerLinks.github")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("developerLinks.x402")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("developerLinks.status")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("legal")}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("legalLinks.privacy")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("legalLinks.terms")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <p className="text-center text-sm text-muted-foreground">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
