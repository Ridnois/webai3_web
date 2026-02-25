"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useModels } from "@/hooks/use-models";
import type { TaskType, ReplicateModel } from "@/types/inference";
import { ChevronDown, Search } from "lucide-react";

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
      className="flex w-full items-center justify-between rounded-lg border border-primary bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium truncate">
          {model.owner}/{model.name}
        </span>
        {model.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {model.description}
          </p>
        )}
      </div>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-2" />
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
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
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
          className="pl-9"
          aria-label="Search models"
        />
      </div>
      <ScrollArea className="h-[280px]">
        <div className="grid gap-2 pr-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          {filtered?.map((model) => (
            <button
              key={`${model.owner}/${model.name}`}
              type="button"
              onClick={() => handleSelect(model)}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50",
                selectedModel?.owner === model.owner &&
                  selectedModel?.name === model.name &&
                  "border-primary bg-primary/5"
              )}
              aria-pressed={
                selectedModel?.owner === model.owner &&
                selectedModel?.name === model.name
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {model.owner}/{model.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRunCount(model.runCount)}
                </span>
              </div>
              {model.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {model.description}
                </p>
              )}
            </button>
          ))}
          {filtered?.length === 0 && !isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No models found matching &quot;{search}&quot;
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
