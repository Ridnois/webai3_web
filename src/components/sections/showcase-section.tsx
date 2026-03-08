import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ArrowRight,
} from "lucide-react";

const showcases = [
  {
    task: "text-to-image" as const,
    label: "Image Generation",
    icon: ImagePlus,
    prompt: "A futuristic cityscape at sunset, cyberpunk style, neon lights reflecting off rain-slicked streets...",
    description: "From product shots to concept art. Flux, Stable Diffusion, and more.",
    href: "/inference/text-to-image",
  },
  {
    task: "text-to-text" as const,
    label: "Text Generation",
    icon: MessageSquareText,
    prompt: "Review this code for bugs and performance issues. Suggest improvements with examples...",
    description: "Code review, blog writing, translation, analysis. Llama, Mixtral, and more.",
    href: "/inference/text-to-text",
  },
  {
    task: "text-to-sound" as const,
    label: "Audio Generation",
    icon: AudioLines,
    prompt: "A warm lo-fi hip hop beat with soft piano chords, gentle vinyl crackle, and a slow drum pattern...",
    description: "Music, sound effects, ambient textures. Stable Audio, MiniMax, and more.",
    href: "/inference/text-to-sound",
  },
];

export function ShowcaseSection() {
  return (
    <section className="bg-muted/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One platform, every modality
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Generate images, text, and audio from a single interface.
            Pick your model, write your prompt, authorize payment, and receive a verifiable result.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {showcases.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.task} href={item.href} className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/30">
                  <CardContent className="flex flex-col gap-5 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.label}</h3>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground font-[family-name:var(--font-geist-mono)] line-clamp-3">
                        {item.prompt}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      Try it now
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
