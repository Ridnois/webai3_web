"use client";

import type { InferenceResponse } from "@/types/inference";
import type { OutputType } from "@/types/task-config";
import { TextResult } from "./text-result";
import { ImageResult } from "./image-result";
import { AudioResult } from "./audio-result";

interface InferenceResultProps {
  response: InferenceResponse;
  outputType: OutputType;
}

export function InferenceResult({
  response,
  outputType,
}: InferenceResultProps) {
  if (response.error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {response.error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {outputType === "text" && <TextResult output={response.output} />}
      {outputType === "image" && <ImageResult output={response.output} />}
      {outputType === "audio" && <AudioResult output={response.output} />}
      {response.metrics?.predictTimeMs && (
        <p className="text-xs text-muted-foreground text-right">
          Completed in {(response.metrics.predictTimeMs / 1000).toFixed(1)}s
        </p>
      )}
    </div>
  );
}
