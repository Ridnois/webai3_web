"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PROMPT_TEMPLATES } from "@/lib/templates";

const TASK_ICONS: Record<string, typeof ImagePlus> = {
  "text-to-image": ImagePlus,
  "text-to-text": MessageSquareText,
  "text-to-sound": AudioLines,
};

// Pick a few featured templates to showcase
const FEATURED_IDS = [
  "cyberpunk-city",
  "code-review",
  "lofi-beat",
  "anime-character",
  "tweet-thread",
  "cinematic-trailer",
];

const featured = FEATURED_IDS
  .map((id) => PROMPT_TEMPLATES.find((t) => t.id === id))
  .filter(Boolean);

function buildTemplateUrl(template: (typeof PROMPT_TEMPLATES)[number]): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(template.input)) {
    params.set(key, String(value));
  }
  return `/inference/${template.task}?${params.toString()}`;
}

export function TemplatesSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="size-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Starter Prompts
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Don&apos;t start from scratch
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pick a template, customize it, run it. Curated prompts for images, text, and audio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((template) => {
            if (!template) return null;
            const Icon = TASK_ICONS[template.task] ?? MessageSquareText;
            const prompt =
              typeof template.input.prompt === "string" ? template.input.prompt : "";

            return (
              <Link key={template.id} href={buildTemplateUrl(template)} className="group">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <span className="text-sm font-medium">{template.title}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-[family-name:var(--font-geist-mono)] bg-muted/50 rounded-md p-2 border">
                      {prompt.slice(0, 140)}...
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates">
              View All Templates
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
