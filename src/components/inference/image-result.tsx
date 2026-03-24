"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { extractImageUrls } from "@/lib/output-helpers";

interface ImageResultProps {
  output: unknown;
}

export function ImageResult({ output }: ImageResultProps) {
  const urls = extractImageUrls(output);

  if (urls.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Unable to extract images from the model output.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {urls.map((url, i) => (
        <div key={url} className="relative flex flex-col gap-2 rounded-lg border bg-muted/50 p-3 overflow-hidden image-shimmer">
          <img
            src={url}
            alt={`Generated image ${i + 1}`}
            className="w-full rounded-md animate-image-reveal"
          />
          <Button variant="outline" size="sm" asChild>
            <a href={url} download target="_blank" rel="noopener noreferrer">
              <Download />
              Download
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}
