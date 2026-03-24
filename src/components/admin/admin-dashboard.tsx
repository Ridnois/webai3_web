"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminMetrics } from "@/hooks/use-admin-metrics";
import type { DailyMetric, ModelMetric, TaskBreakdownItem } from "@/hooks/use-admin-metrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConnectSignInButton } from "@/components/auth/connect-sign-in-button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Users,
  Zap,
  DollarSign,
  Activity,
  Clock,
  ImageIcon,
  MessageSquare,
  Music,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Cpu,
  BarChart3,
} from "lucide-react";
import { ModelDetailDialog } from "./model-detail-dialog";

// ── constants ─────────────────────────────────────────────────────────────────

const TASK_LABELS: Record<string, string> = {
  "text-to-image": "Image",
  "text-to-text":  "Text",
  "text-to-sound": "Audio",
};

const TASK_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "text-to-image": ImageIcon,
  "text-to-text":  MessageSquare,
  "text-to-sound": Music,
};

const TASK_COLORS: Record<string, string> = {
  "text-to-image": "#f97316",
  "text-to-text":  "#06b6d4",
  "text-to-sound": "#a855f7",
};

const MODEL_BAR_COLORS = [
  "#f97316", "#06b6d4", "#a855f7", "#22c55e",
  "#ef4444", "#eab308", "#3b82f6", "#ec4899",
];

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes < 60) return `${minutes}m ${rem}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shortModel(model: string): string {
  const parts = model.split("/");
  return parts[parts.length - 1]?.slice(0, 22) ?? model.slice(0, 22);
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function formatInferenceXTick(value: string, isHourly: boolean): string {
  const d = new Date(value);
  if (isHourly) {
    if (d.getHours() === 0) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatInferenceTooltipLabel(value: string, isHourly: boolean): string {
  const d = new Date(value);
  if (isHourly) {
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ── chart configs ─────────────────────────────────────────────────────────────

const inferenceChartConfig = {
  textToImage: { label: "Image", color: TASK_COLORS["text-to-image"] },
  textToText:  { label: "Text",  color: TASK_COLORS["text-to-text"] },
  textToSound: { label: "Audio", color: TASK_COLORS["text-to-sound"] },
} satisfies ChartConfig;

const revenueChartConfig = {
  revenue: { label: "Revenue (USDC)", color: "#10b981" },
} satisfies ChartConfig;

const taskPieConfig = {
  "text-to-image": { label: "Image", color: TASK_COLORS["text-to-image"] },
  "text-to-text":  { label: "Text",  color: TASK_COLORS["text-to-text"] },
  "text-to-sound": { label: "Audio", color: TASK_COLORS["text-to-sound"] },
} satisfies ChartConfig;

const modelBarConfig = {
  calls: { label: "Calls", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// ── range toggle ──────────────────────────────────────────────────────────────

type ChartRange = "24h" | "48h" | "7d" | "30d";

const RANGE_OPTIONS: { label: string; value: ChartRange }[] = [
  { label: "24h", value: "24h" },
  { label: "48h", value: "48h" },
  { label: "7d",  value: "7d" },
  { label: "30d", value: "30d" },
];

function RangeToggle({ value, onChange }: { value: ChartRange; onChange: (v: ChartRange) => void }) {
  return (
    <div className="flex shrink-0 items-center rounded-md border border-border/60 bg-muted/30 p-0.5">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

// ── dashboard header ──────────────────────────────────────────────────────────

function DashboardHeader({
  fetchedAt,
  onRefresh,
  isLoading,
}: {
  fetchedAt: Date;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Platform Overview</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Inference activity, revenue, and model performance
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Updated {timeAgo(fetchedAt)}
          </span>
          <span className="text-xs text-muted-foreground sm:hidden">Live</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}

// ── kpi cards ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  secondary,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  secondary?: React.ReactNode;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      {/* Accent bar */}
      <div className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: accent }} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 pl-5">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent + "18" }}
        >
          <Icon className="size-4" style={{ color: accent }} />
        </div>
      </CardHeader>
      <CardContent className="pl-5">
        <div className="truncate text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</div>
        {secondary && (
          <div className="mt-1.5 text-xs text-muted-foreground">{secondary}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ── secondary metrics strip ───────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="font-mono text-xs font-semibold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function SecondaryMetricsStrip({
  failedCount,
  successRate,
  todayTotal,
  revenuePerInference,
  totalTimeMs,
  peakHour,
  activeModels,
  totalModels,
}: {
  failedCount: number;
  successRate: number | null;
  todayTotal: number;
  revenuePerInference: number;
  totalTimeMs: number;
  peakHour: string | null;
  activeModels: number;
  totalModels: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-2">
      <MetricPill
        label="Failed"
        value={failedCount.toLocaleString()}
        color={failedCount > 0 ? "#ef4444" : undefined}
      />
      <MetricPill
        label="Success"
        value={successRate != null ? `${successRate}%` : "—"}
        color={successRate != null ? (successRate >= 90 ? "#22c55e" : successRate >= 70 ? "#f59e0b" : "#ef4444") : undefined}
      />
      <MetricPill label="Today" value={todayTotal.toLocaleString()} />
      <MetricPill label="$/inference" value={`$${revenuePerInference.toFixed(4)}`} />
      <MetricPill label="Compute" value={formatDuration(totalTimeMs)} />
      {peakHour && <MetricPill label="Peak hour" value={peakHour} />}
      <MetricPill label="Active models" value={`${activeModels} / ${totalModels}`} />
    </div>
  );
}

// ── loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full sm:w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-0.5 bg-muted" />
            <CardHeader className="pb-2 pl-5"><Skeleton className="h-3 w-20" /></CardHeader>
            <CardContent className="pl-5">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
      <Card><CardContent className="pt-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
    </div>
  );
}

// ── inference trend chart ─────────────────────────────────────────────────────

function InferenceTrendChart({
  dailyMetrics,
  hourlyMetrics,
}: {
  dailyMetrics: DailyMetric[];
  hourlyMetrics: DailyMetric[];
}) {
  const [range, setRange] = useState<ChartRange>("30d");
  const isHourly = range === "24h" || range === "48h";

  const data = useMemo(() => {
    if (!isHourly) return dailyMetrics.slice(range === "7d" ? -7 : -30);
    return hourlyMetrics.slice(range === "24h" ? -24 : -48);
  }, [range, isHourly, dailyMetrics, hourlyMetrics]);

  const xAxisInterval = isHourly ? (range === "24h" ? 3 : 6) : "preserveStartEnd";

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Inferences</CardTitle>
          <CardDescription>
            By task type · {isHourly ? "1-hour buckets" : "daily buckets"}
          </CardDescription>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <ChartContainer config={inferenceChartConfig} className="h-56 w-full sm:h-64">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="imgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TASK_COLORS["text-to-image"]} stopOpacity={0.55} />
                <stop offset="100%" stopColor={TASK_COLORS["text-to-image"]} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="txtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TASK_COLORS["text-to-text"]} stopOpacity={0.55} />
                <stop offset="100%" stopColor={TASK_COLORS["text-to-text"]} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="audGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TASK_COLORS["text-to-sound"]} stopOpacity={0.55} />
                <stop offset="100%" stopColor={TASK_COLORS["text-to-sound"]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatInferenceXTick(String(v), isHourly)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={xAxisInterval}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(v) => formatInferenceTooltipLabel(String(v), isHourly)} />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area type="monotone" dataKey="textToImage" stackId="1" stroke={TASK_COLORS["text-to-image"]} fill="url(#imgGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="textToText"  stackId="1" stroke={TASK_COLORS["text-to-text"]}  fill="url(#txtGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="textToSound" stackId="1" stroke={TASK_COLORS["text-to-sound"]} fill="url(#audGrad)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── task breakdown chart ──────────────────────────────────────────────────────

function TaskBreakdownChart({ data }: { data: TaskBreakdownItem[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Task Mix</CardTitle>
        <CardDescription>Distribution by type</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ChartContainer config={taskPieConfig} className="mx-auto h-44 w-44">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="taskType"
              cx="50%"
              cy="50%"
              innerRadius="48%"
              outerRadius="78%"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.taskType}
                  fill={TASK_COLORS[entry.taskType] ?? "#94a3b8"}
                  opacity={0.9}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v, name) => [
                    `${v} (${total > 0 ? Math.round((Number(v) / total) * 100) : 0}%)`,
                    TASK_LABELS[String(name)] ?? String(name),
                  ]}
                />
              }
            />
          </PieChart>
        </ChartContainer>

        <div className="space-y-2.5">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            const revPct = totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 100) : 0;
            const Icon = TASK_ICONS[d.taskType] ?? Activity;
            const color = TASK_COLORS[d.taskType] ?? "#94a3b8";
            return (
              <div key={d.taskType} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{TASK_LABELS[d.taskType] ?? d.taskType}</span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-muted-foreground">{d.count.toLocaleString()} runs</span>
                    <span className="w-7 text-right font-semibold">{pct}%</span>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-right text-[10px] text-muted-foreground">
                  ${d.revenue.toFixed(4)} · {revPct}% of revenue
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── revenue trend chart ───────────────────────────────────────────────────────

function RevenueTrendChart({
  dailyMetrics,
  hourlyMetrics,
}: {
  dailyMetrics: DailyMetric[];
  hourlyMetrics: DailyMetric[];
}) {
  const [range, setRange] = useState<ChartRange>("30d");
  const isHourly = range === "24h" || range === "48h";

  const data = useMemo(() => {
    if (!isHourly) return dailyMetrics.slice(range === "7d" ? -7 : -30);
    return hourlyMetrics.slice(range === "24h" ? -24 : -48);
  }, [range, isHourly, dailyMetrics, hourlyMetrics]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Revenue</CardTitle>
          <CardDescription>USDC settled · {isHourly ? "hourly" : "daily"}</CardDescription>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueChartConfig} className="h-64 w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatInferenceXTick(String(v), isHourly)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={isHourly ? (range === "24h" ? 3 : 6) : "preserveStartEnd"}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => formatInferenceTooltipLabel(String(v), isHourly)}
                  formatter={(v) => [`$${Number(v).toFixed(4)}`, "Revenue"]}
                />
              }
            />
            <Bar dataKey="revenue" fill="url(#revGrad)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── top models chart ──────────────────────────────────────────────────────────

function TopModelsChart({
  models,
  onModelClick,
}: {
  models: ModelMetric[];
  onModelClick: (model: string) => void;
}) {
  const top = models.slice(0, 8).map((m, i) => ({
    name: shortModel(m.model),
    fullModel: m.model,
    calls: m.totalCalls,
    color: MODEL_BAR_COLORS[i % MODEL_BAR_COLORS.length]!,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top Models</CardTitle>
        <CardDescription>By call count · click to inspect</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={modelBarConfig} className="h-64 w-full">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
            onClick={(d) => {
              if (d?.activePayload?.[0]?.payload?.fullModel) {
                onModelClick(d.activePayload[0].payload.fullModel as string);
              }
            }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={72} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="calls" radius={[0, 3, 3, 0]} cursor="pointer">
              {top.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── model table ───────────────────────────────────────────────────────────────

function ModelTable({
  models,
  onModelClick,
}: {
  models: ModelMetric[];
  onModelClick: (model: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Per-Model Breakdown</CardTitle>
        <CardDescription>All models sorted by calls · click any row to inspect inference times</CardDescription>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No inference data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4 font-semibold">Model</th>
                  <th className="pb-3 pr-3 font-semibold">Type</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Calls</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Success</th>
                  <th className="hidden pb-3 pr-4 text-right font-semibold sm:table-cell">Avg Time</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Revenue</th>
                  <th className="hidden pb-3 pr-4 text-right font-semibold md:table-cell">$/call</th>
                  <th className="hidden pb-3 text-right font-semibold lg:table-cell">Last Run</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {models.map((m) => {
                  const successRate = m.totalCalls > 0
                    ? Math.round((m.successCount / m.totalCalls) * 100)
                    : 0;
                  const revenuePerCall = m.totalCalls > 0
                    ? m.totalRevenueUsdc / m.totalCalls
                    : 0;

                  return (
                    <tr
                      key={`${m.model}-${m.taskType}`}
                      className="group cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => onModelClick(m.model)}
                    >
                      <td className="py-3 pr-4 max-w-[140px] sm:max-w-[200px]">
                        <code className="block truncate rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {m.model}
                        </code>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          style={{
                            borderColor: (TASK_COLORS[m.taskType] ?? "#94a3b8") + "55",
                            color: TASK_COLORS[m.taskType] ?? undefined,
                          }}
                        >
                          {TASK_LABELS[m.taskType] ?? m.taskType}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {m.totalCalls.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Badge
                          variant={successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {successRate}%
                        </Badge>
                      </td>
                      <td className="hidden py-3 pr-4 text-right tabular-nums sm:table-cell">
                        {m.avgResponseMs != null
                          ? <span className="font-mono text-xs">{m.avgResponseMs.toLocaleString()} ms</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums">
                        ${m.totalRevenueUsdc.toFixed(4)}
                      </td>
                      <td className="hidden py-3 pr-4 text-right font-mono text-xs tabular-nums text-muted-foreground md:table-cell">
                        ${revenuePerCall.toFixed(4)}
                      </td>
                      <td className="hidden py-3 text-right text-xs text-muted-foreground lg:table-cell">
                        {m.lastUsed ? new Date(m.lastUsed).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 pl-2">
                        <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [fetchedAt] = useState(() => new Date());

  const {
    isAdmin,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useAdminMetrics();

  // ── derived metrics — must be before any early returns ───────────────────

  const hourlyMetrics = data?.hourlyMetrics ?? [];
  const models = data?.models ?? [];

  const overallSuccessRate = data && data.summary.totalInferences > 0
    ? Math.round((data.summary.succeededCount / data.summary.totalInferences) * 100)
    : null;

  const todayTotal = useMemo(() => {
    return hourlyMetrics.slice(-24).reduce((s, r) => s + r.total, 0);
  }, [hourlyMetrics]);

  const revenuePerInference = data && data.summary.totalInferences > 0
    ? data.summary.totalRevenueUsdc / data.summary.totalInferences
    : 0;

  const peakHour = useMemo(() => {
    if (hourlyMetrics.length === 0) return null;
    const peak = hourlyMetrics.reduce((best, cur) => cur.total > best.total ? cur : best);
    if (peak.total === 0) return null;
    const d = new Date(peak.date);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }, [hourlyMetrics]);

  const activeModels = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return models.filter((m) => m.lastUsed && new Date(m.lastUsed) >= sevenDaysAgo).length;
  }, [models]);

  // ── early returns ─────────────────────────────────────────────────────────

  if (isAuthLoading) return <LoadingSkeleton />;

  if (!isAdmin) {
    if (!isAuthenticated) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold">Admin sign-in required</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your admin wallet and sign in to continue.
            </p>
            <div className="mt-4">
              <ConnectSignInButton />
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-semibold">Access Denied</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-semibold text-destructive">Failed to load metrics</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, taskBreakdown, dailyMetrics } = data;

  return (
    <>
      <div className="space-y-8">

        {/* Header */}
        <DashboardHeader
          fetchedAt={fetchedAt}
          onRefresh={() => refetch()}
          isLoading={isFetching}
        />

        {/* ── Overview ────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Overview</SectionLabel>

          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Revenue"
              value={`$${summary.totalRevenueUsdc.toFixed(4)}`}
              secondary={<>Est. <span className="font-mono">${summary.totalEstimatedUsdc.toFixed(4)}</span> · USDC on-chain</>}
              icon={DollarSign}
              accent="#10b981"
            />
            <KpiCard
              title="Total Inferences"
              value={summary.totalInferences.toLocaleString()}
              secondary={
                overallSuccessRate != null
                  ? <span className={overallSuccessRate >= 90 ? "text-emerald-500" : overallSuccessRate >= 70 ? "text-amber-500" : "text-destructive"}>
                      {overallSuccessRate}% success rate
                    </span>
                  : undefined
              }
              icon={Zap}
              accent="#a855f7"
            />
            <KpiCard
              title="Unique Users"
              value={summary.uniqueUsers.toLocaleString()}
              secondary={<>Across <span className="font-mono">{summary.uniqueModels}</span> models</>}
              icon={Users}
              accent="#06b6d4"
            />
            <KpiCard
              title="Avg Response Time"
              value={summary.avgResponseMs != null ? `${summary.avgResponseMs.toLocaleString()} ms` : "N/A"}
              secondary={<>Total compute <span className="font-mono">{formatDuration(summary.totalTimeMs)}</span></>}
              icon={Clock}
              accent="#f97316"
            />
          </div>

          {/* Secondary metrics strip */}
          <SecondaryMetricsStrip
            failedCount={summary.failedCount}
            successRate={overallSuccessRate}
            todayTotal={todayTotal}
            revenuePerInference={revenuePerInference}
            totalTimeMs={summary.totalTimeMs}
            peakHour={peakHour}
            activeModels={activeModels}
            totalModels={summary.uniqueModels}
          />
        </div>

        {/* ── Trends ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Trends</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-3">
            <InferenceTrendChart dailyMetrics={dailyMetrics} hourlyMetrics={hourlyMetrics} />
            <TaskBreakdownChart data={taskBreakdown} />
          </div>
        </div>

        {/* ── Revenue & Models ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Revenue &amp; Models</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            <RevenueTrendChart dailyMetrics={dailyMetrics} hourlyMetrics={hourlyMetrics} />
            <TopModelsChart models={models} onModelClick={setSelectedModel} />
          </div>
        </div>

        {/* ── Model Detail ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Model Detail</SectionLabel>
          <ModelTable models={models} onModelClick={setSelectedModel} />
        </div>

      </div>

      <ModelDetailDialog
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />
    </>
  );
}
