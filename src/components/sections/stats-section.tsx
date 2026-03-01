"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePlatformStats } from "@/hooks/use-platform-stats";
import { Skeleton } from "@/components/ui/skeleton";

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);

    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutQuart(progress) * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, hasStarted]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [start]);

  return { ref, value };
}

function formatDuration(ms: number): { value: number; unit: string } {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return { value: seconds, unit: "seconds" };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { value: minutes, unit: "minutes" };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: hours, unit: "hours" };
  const days = Math.floor(hours / 24);
  return { value: days, unit: "days" };
}

function AnimatedStat({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix?: string;
  label: string;
}) {
  const { ref, value } = useCountUp(target);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className="tabular-nums text-4xl font-bold tracking-tight sm:text-5xl">
        {value.toLocaleString()}
        {suffix && (
          <span className="ml-1 text-2xl text-muted-foreground sm:text-3xl">
            {suffix}
          </span>
        )}
      </span>
      <span className="mt-2 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="h-12 w-24" />
      <Skeleton className="mt-3 h-4 w-32" />
    </div>
  );
}

export function StatsSection() {
  const { data, isLoading } = usePlatformStats();

  const duration = data ? formatDuration(data.totalTimeMs) : null;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {isLoading || !data || !duration ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <AnimatedStat
                target={data.totalInferences}
                label="Total Inferences"
              />
              <AnimatedStat
                target={duration.value}
                suffix={duration.unit}
                label="Total Inference Time"
              />
              <AnimatedStat
                target={data.totalUsers}
                label="Unique Users"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
