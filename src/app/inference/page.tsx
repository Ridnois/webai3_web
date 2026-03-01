import type { Metadata } from "next";
import { TaskCard } from "@/components/inference/task-card";
import { TASK_CONFIGS } from "@/types/task-config";
import type { TaskType } from "@/types/inference";

export const metadata: Metadata = {
  title: "AI Inference — web3-ai",
  description:
    "Choose an AI task: text-to-image, text-to-text, or text-to-sound. Pay per inference with USDC micropayments.",
};

const TASKS: TaskType[] = ["text-to-image", "text-to-text", "text-to-sound"];

export default function InferencePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AI Inference
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Pick a task, choose a model, and get results. Pay only for what you
          use.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TASKS.map((task) => (
          <TaskCard key={task} config={TASK_CONFIGS[task]} />
        ))}
      </div>
    </div>
  );
}
