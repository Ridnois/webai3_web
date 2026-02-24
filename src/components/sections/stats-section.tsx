import { useTranslations } from "next-intl";
import { StatItem } from "@/components/stat-item";

export function StatsSection() {
  const t = useTranslations("stats");

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <StatItem
            value={t("transactions")}
            label={t("transactionsLabel")}
          />
          <StatItem value={t("avgCost")} label={t("avgCostLabel")} />
          <StatItem value={t("uptime")} label={t("uptimeLabel")} />
        </div>
      </div>
    </section>
  );
}
