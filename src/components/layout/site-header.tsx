import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const t = useTranslations("header");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          <NavLink href="#how-it-works">{t("howItWorks")}</NavLink>
          <NavLink href="#features">{t("features")}</NavLink>
          <NavLink href="#pricing">{t("pricing")}</NavLink>
        </nav>
        <Button size="sm">{t("getStarted")}</Button>
      </div>
    </header>
  );
}
