"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ModelSelector } from "./model-selector";
import { InferenceForm } from "./inference-form";
import { InferenceResult } from "./inference-result";
import { InferenceLoading } from "./inference-loading";
import { useInference } from "@/hooks/use-inference";
import { useAuth } from "@/hooks/use-auth";
import { TASK_CONFIGS } from "@/types/task-config";
import type { TaskType, ReplicateModel } from "@/types/inference";
import {
  ImagePlus,
  MessageSquareText,
  AudioLines,
  Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, typeof ImagePlus> = {
  ImagePlus,
  MessageSquareText,
  AudioLines,
};

interface InferencePageLayoutProps {
  task: TaskType;
}

export function InferencePageLayout({ task }: InferencePageLayoutProps) {
  const config = TASK_CONFIGS[task];
  const Icon = ICON_MAP[config.icon] ?? MessageSquareText;
  const [selectedModel, setSelectedModel] = useState<ReplicateModel | null>(
    null
  );
  const inference = useInference();
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();

  function handleSubmit(input: Record<string, unknown>) {
    if (!selectedModel) return;

    if (!isAuthenticated) {
      signIn();
      return;
    }

    inference.mutate({
      model: `${selectedModel.owner}/${selectedModel.name}`,
      task,
      input,
    });
  }

  const submitLabel =
    isConnected && !isAuthenticated ? "Sign in to Run" : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{config.label}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Choose a Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ModelSelector
                task={task}
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Input</CardTitle>
            </CardHeader>
            <CardContent>
              <InferenceForm
                fields={config.fields}
                selectedModel={selectedModel}
                isLoading={inference.isPending || isSigningIn}
                onSubmit={handleSubmit}
                submitLabel={submitLabel}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {inference.isPending && <InferenceLoading />}

            {inference.data && !inference.isPending && (
              <InferenceResult
                response={inference.data}
                outputType={config.outputType}
              />
            )}

            {inference.error && !inference.isPending && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {inference.error.message}
              </div>
            )}

            {!inference.data && !inference.isPending && !inference.error && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Sparkles className="size-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No results yet
                  </p>
                  <p className="text-xs text-muted-foreground/75 mt-1">
                    Select a model and submit your input to see results
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
