import { StatItem } from "@/components/stat-item";

export function StatsSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <StatItem value="1M+" label="Transactions Processed" />
          <StatItem value="$0.002" label="Avg. Cost per Inference" />
          <StatItem value="99.9%" label="Uptime" />
        </div>
      </div>
    </section>
  );
}
