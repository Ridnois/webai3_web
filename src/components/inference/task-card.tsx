import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { TaskConfig } from "@/types/task-config";
import {
  Image,
  ImagePlus,
  MessageSquareText,
  AudioLines,
  ArrowRight,
} from "lucide-react";

const ICON_MAP: Record<string, typeof Image> = {
  Image,
  ImagePlus,
  MessageSquareText,
  AudioLines,
};

interface TaskCardProps {
  config: TaskConfig;
}

export function TaskCard({ config }: TaskCardProps) {
  const Icon = ICON_MAP[config.icon] ?? MessageSquareText;

  return (
    <Link href={`/inference/${config.task}`} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/30">
        <CardHeader className="pb-4">
          <div className="mb-3 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-7" />
          </div>
          <CardTitle className="text-xl">{config.label}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            Get Started
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
