"use client";

import { useModelInferences } from "@/hooks/use-model-inferences";
import type { ModelInference } from "@/hooks/use-model-inferences";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock, Zap, TrendingDown, TrendingUp, Activity } from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────

interface ScatterPoint {
  x: number;
  y: number;
  status: string;
  cost: number | null;
  id: string;
  userAddress: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── chart config ──────────────────────────────────────────────────────────────

const scatterConfig = {
  succeeded: { label: "Succeeded", color: "hsl(var(--chart-2))" },
  failed:    { label: "Failed",    color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

// ── custom tooltip ────────────────────────────────────────────────────────────

function ScatterTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ScatterPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-medium">{fmtDate(d.x)}</p>
      <div className="space-y-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-4">
          <span>Inference time</span>
          <span className="font-mono font-medium text-foreground">{fmtMs(d.y)}</span>
        </div>
        {d.cost != null && (
          <div className="flex items-center justify-between gap-4">
            <span>Cost</span>
            <span className="font-mono font-medium text-foreground">${d.cost.toFixed(4)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span>User</span>
          <span className="font-mono text-foreground">{d.userAddress}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Status</span>
          <span
            className={
              d.status === "succeeded"
                ? "font-medium text-emerald-500"
                : "font-medium text-destructive"
            }
          >
            {d.status}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── stats strip ───────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon: Icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className={`size-3 shrink-0 ${valueClass ?? ""}`} />
        {label}
      </div>
      <p className={`font-mono text-lg font-bold leading-none ${valueClass ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function StatsStrip({ inferences }: { inferences: ModelInference[] }) {
  const succeeded = inferences.filter((i) => i.status === "succeeded");
  const failed = inferences.filter((i) => i.status === "failed");
  const times = succeeded.map((i) => i.predictTimeMs!).filter(Boolean);

  const avg = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null;
  const min = times.length > 0 ? Math.min(...times) : null;
  const max = times.length > 0 ? Math.max(...times) : null;
  const successRate =
    inferences.length > 0
      ? Math.round((succeeded.length / inferences.length) * 100)
      : null;

  return (
    <div className="space-y-2">
      {/* Outcome row — 4 equal cols */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label="Total runs"
          value={inferences.length.toLocaleString()}
          icon={Zap}
        />
        <StatTile
          label="Succeeded"
          value={succeeded.length.toLocaleString()}
          icon={CheckCircle2}
          valueClass="text-emerald-500"
        />
        <StatTile
          label="Failed"
          value={failed.length.toLocaleString()}
          icon={XCircle}
          valueClass="text-destructive"
        />
        <StatTile
          label="Success rate"
          value={successRate != null ? `${successRate}%` : "—"}
          icon={Activity}
          valueClass={
            successRate == null
              ? undefined
              : successRate >= 90
                ? "text-emerald-500"
                : successRate >= 70
                  ? "text-amber-500"
                  : "text-destructive"
          }
        />
      </div>

      {/* Timing row — 3 equal cols */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          label="Avg inference time"
          value={avg != null ? fmtMs(avg) : "—"}
          icon={Clock}
        />
        <StatTile
          label="Fastest"
          value={min != null ? fmtMs(min) : "—"}
          icon={TrendingDown}
        />
        <StatTile
          label="Slowest"
          value={max != null ? fmtMs(max) : "—"}
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}

// ── chart legend ──────────────────────────────────────────────────────────────

function InferenceChartLegend() {
  return (
    <div className="flex items-center gap-5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-full bg-[hsl(var(--chart-2))]" />
        Succeeded
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-full bg-destructive" />
        Failed
      </span>
      <span className="ml-1 flex items-center gap-1.5 text-[10px]">
        <span className="inline-block h-px w-5 border-t border-dashed border-muted-foreground" />
        Average
      </span>
    </div>
  );
}

// ── scatter chart ─────────────────────────────────────────────────────────────

function InferenceScatterChart({
  inferences,
  compact = false,
}: {
  inferences: ModelInference[];
  compact?: boolean;
}) {
  const succeeded = inferences
    .filter((i) => i.status === "succeeded" && i.predictTimeMs != null)
    .map<ScatterPoint>((i) => ({
      x: new Date(i.createdAt).getTime(),
      y: i.predictTimeMs!,
      status: i.status,
      cost: i.actualCostUsdc,
      id: i.id,
      userAddress: i.userAddress,
    }));

  const failed = inferences
    .filter((i) => i.status === "failed" && i.predictTimeMs != null)
    .map<ScatterPoint>((i) => ({
      x: new Date(i.createdAt).getTime(),
      y: i.predictTimeMs!,
      status: i.status,
      cost: i.actualCostUsdc,
      id: i.id,
      userAddress: i.userAddress,
    }));

  const allTimes = [...succeeded, ...failed].map((p) => p.y);
  const avgMs =
    allTimes.length > 0
      ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
      : null;

  if (succeeded.length === 0 && failed.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
        No timed inference data available for this model.
      </div>
    );
  }

  const chartHeight = compact ? "h-64" : "h-[420px]";

  return (
    <ChartContainer config={scatterConfig} className={`${chartHeight} w-full`}>
      <ScatterChart margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="x"
          type="number"
          domain={["auto", "auto"]}
          scale="time"
          tickFormatter={(v: number) =>
            new Date(v).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          dataKey="y"
          type="number"
          tickFormatter={(v: number) => fmtMs(v)}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={58}
        />
        {avgMs != null && (
          <ReferenceLine
            y={avgMs}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: `avg ${fmtMs(avgMs)}`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
              dy: -6,
            }}
          />
        )}
        <ChartTooltip content={<ScatterTooltipContent />} />
        <Scatter
          name="succeeded"
          data={succeeded}
          fill="hsl(var(--chart-2))"
          fillOpacity={0.7}
          r={compact ? 4 : 5}
        />
        <Scatter
          name="failed"
          data={failed}
          fill="hsl(var(--destructive))"
          fillOpacity={0.85}
          r={compact ? 4 : 5}
        />
      </ScatterChart>
    </ChartContainer>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export function ModelDetailView({
  model,
  compact = false,
}: {
  model: string;
  compact?: boolean;
}) {
  const { data, isLoading, error } = useModelInferences(model);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className={`w-full ${compact ? "h-64" : "h-[420px]"}`} />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Failed to load inference data.
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <StatsStrip inferences={data} />
      <InferenceChartLegend />
      <InferenceScatterChart inferences={data} compact={compact} />
    </div>
  );
}
