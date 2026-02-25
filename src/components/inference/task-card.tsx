import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <CardTitle className="text-lg">{config.label}</CardTitle>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/inference/${config.task}`}>
            Get Started
            <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
