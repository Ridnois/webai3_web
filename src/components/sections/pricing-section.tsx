import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ArrowRight,
  Check,
} from "lucide-react";

const tasks = [
  {
    icon: ImagePlus,
    label: "Text to Image",
    estimate: "~$0.0100",
    time: "~10s",
    href: "/inference/text-to-image",
    examples: "Flux, Stable Diffusion, SDXL",
  },
  {
    icon: MessageSquareText,
    label: "Text to Text",
    estimate: "~$0.0030",
    time: "~3s",
    href: "/inference/text-to-text",
    examples: "Llama 3, Mixtral, Gemma",
  },
  {
    icon: AudioLines,
    label: "Text to Sound",
    estimate: "~$0.0150",
    time: "~15s",
    href: "/inference/text-to-sound",
    examples: "Stable Audio, MiniMax Music",
  },
];

const perks = [
  "No subscriptions or monthly fees",
  "No minimum balance required",
  "Usage-based USDC pricing with upfront estimate",
  "On-chain settlement receipt for every run",
  "Media stored permanently in the cloud",
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pay only for what you use. Cost is based on model execution time with a default protocol rate of $0.001 USDC/sec.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-12">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <Card key={task.label} className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">{task.label}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">
                      {task.estimate}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      per run
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Avg. {task.time}</span>
                    <Badge variant="secondary" className="text-xs">
                      USDC
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Models: {task.examples}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estimate only. Final cost depends on actual model runtime.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={task.href}>
                      Try it
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mx-auto max-w-lg">
          <ul className="grid gap-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="size-4 shrink-0 text-primary" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
