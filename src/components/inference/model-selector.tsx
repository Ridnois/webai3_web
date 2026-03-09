"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useModels } from "@/hooks/use-models";
import type { TaskType, ReplicateModel } from "@/types/inference";

interface ModelSelectorProps {
  task: TaskType;
  selectedModel: ReplicateModel | null;
  onSelect: (model: ReplicateModel) => void;
}

function SelectedModelDisplay({
  model,
  onChangeClick,
}: {
  model: ReplicateModel;
  onChangeClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChangeClick}
      className="flex w-full items-center justify-between rounded-3xl border border-primary/30 bg-linear-to-br from-primary/10 via-background to-chart-2/8 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_18px_50px_-32px_var(--primary)]"
    >
      <div className="min-w-0 flex flex-col gap-1">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary">
          Selected model
        </span>
        <span className="truncate text-sm font-semibold">
          {model.owner}/{model.name}
        </span>
        {model.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {model.description}
          </p>
        )}
      </div>
      <ChevronDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function formatRunCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M runs`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K runs`;
  return `${count} runs`;
}

export function ModelSelector({
  task,
  selectedModel,
  onSelect,
}: ModelSelectorProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(true);
  const { data: models, isLoading, error } = useModels(task);

  const filtered = models?.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.owner.toLowerCase().includes(q) ||
      (m.description?.toLowerCase().includes(q) ?? false)
    );
  });

  function handleSelect(model: ReplicateModel) {
    onSelect(model);
    setExpanded(false);
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load models: {error.message}
      </div>
    );
  }

  if (selectedModel && !expanded) {
    return (
      <SelectedModelDisplay
        model={selectedModel}
        onChangeClick={() => setExpanded(true)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-2xl border-border/70 bg-background/80 pl-9 shadow-sm"
          aria-label="Search models"
        />
      </div>
      <ScrollArea className="h-[320px] rounded-3xl border border-border/70 bg-background/70 p-1.5 shadow-sm">
        <div className="grid gap-2 pr-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          {filtered?.map((model) => (
            <button
              key={`${model.owner}/${model.name}`}
              type="button"
              onClick={() => handleSelect(model)}
              className={cn(
                "flex flex-col gap-2 rounded-[1.4rem] border border-transparent bg-transparent p-4 text-left transition-all hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted/55",
                selectedModel?.owner === model.owner &&
                  selectedModel?.name === model.name &&
                  "border-primary/30 bg-linear-to-br from-primary/10 via-background to-chart-2/8 shadow-[0_18px_50px_-32px_var(--primary)]"
              )}
              aria-pressed={
                selectedModel?.owner === model.owner &&
                selectedModel?.name === model.name
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {model.owner}/{model.name}
                </span>
                <span className="shrink-0 rounded-full border border-border/70 px-2 py-1 text-[11px] text-muted-foreground">
                  {formatRunCount(model.runCount)}
                </span>
              </div>
              {model.description && (
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {model.description}
                </p>
              )}
            </button>
          ))}
          {filtered?.length === 0 && !isLoading && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No models found matching &quot;{search}&quot;
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
