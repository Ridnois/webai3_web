"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface AudioResultProps {
  output: unknown;
}

function extractAudioUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (
    output &&
    typeof output === "object" &&
    "audio_out" in output &&
    typeof (output as Record<string, unknown>).audio_out === "string"
  ) {
    return (output as Record<string, unknown>).audio_out as string;
  }
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
    return output[0];
  }
  return null;
}

export function AudioResult({ output }: AudioResultProps) {
  const url = extractAudioUrl(output);

  if (!url) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Unable to extract audio from the model output.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
      <audio controls className="w-full" src={url} aria-label="Generated audio">
        Your browser does not support the audio element.
      </audio>
      <Button variant="outline" size="sm" asChild>
        <a href={url} download target="_blank" rel="noopener noreferrer">
          <Download />
          Download Audio
        </a>
      </Button>
    </div>
  );
}
