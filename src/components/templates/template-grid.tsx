"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PROMPT_TEMPLATES, type PromptTemplate } from "@/lib/templates";
import type { TaskType } from "@/types/inference";

const TASK_ICONS: Record<string, typeof ImagePlus> = {
  "text-to-image": ImagePlus,
  "text-to-text": MessageSquareText,
  "text-to-sound": AudioLines,
};

const TASK_LABELS: Record<string, string> = {
  "text-to-image": "Image",
  "text-to-text": "Text",
  "text-to-sound": "Audio",
};

function buildTemplateUrl(template: PromptTemplate): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(template.input)) {
    params.set(key, String(value));
  }
  return `/inference/${template.task}?${params.toString()}`;
}

function TemplateCard({ template }: { template: PromptTemplate }) {
  const Icon = TASK_ICONS[template.task] ?? MessageSquareText;
  const prompt =
    typeof template.input.prompt === "string"
      ? template.input.prompt
      : "";

  return (
    <Card className="group h-full flex flex-col transition-all hover:shadow-lg hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {template.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {TASK_LABELS[template.task]}
          </Badge>
        </div>
        <CardTitle className="text-base">{template.title}</CardTitle>
        <CardDescription className="text-sm">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <p className="text-xs text-muted-foreground line-clamp-3 font-[family-name:var(--font-geist-mono)] bg-muted/50 rounded-md p-2.5 border">
          {prompt.slice(0, 200)}{prompt.length > 200 ? "..." : ""}
        </p>
        <Button variant="default" size="sm" asChild>
          <Link href={buildTemplateUrl(template)}>
            Use This Template
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function TemplateGrid() {
  const [taskFilter, setTaskFilter] = useState<string>("all");

  const filtered =
    taskFilter === "all"
      ? PROMPT_TEMPLATES
      : PROMPT_TEMPLATES.filter((t) => t.task === taskFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="size-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Prompt Templates
          </h1>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-lg text-muted-foreground">
          Ready-to-use prompts to get started instantly. Pick one, customize it, and run.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <Tabs value={taskFilter} onValueChange={setTaskFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="text-to-image">
              <ImagePlus className="size-4 mr-1.5" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text-to-text">
              <MessageSquareText className="size-4 mr-1.5" />
              Text
            </TabsTrigger>
            <TabsTrigger value="text-to-sound">
              <AudioLines className="size-4 mr-1.5" />
              Audio
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Sparkles className="size-12 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No templates for this category yet
          </p>
        </div>
      )}
    </div>
  );
}
