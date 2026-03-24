"use client";

import { useState, useMemo } from "react";
import type { InferenceResponse } from "@/types/inference";
import type { OutputType } from "@/types/task-config";
import { useShareInference } from "@/hooks/use-share-inference";
import { toastSuccess, toastError } from "@/lib/toast";
import { fromInferenceResponse } from "@/types/output-item";
import { OutputView } from "@/components/output/output-view";

interface InferenceResultProps {
  response: InferenceResponse;
  outputType: OutputType;
}

export function InferenceResult({
  response,
  outputType,
}: InferenceResultProps) {
  const shareMutation = useShareInference();
  const [isPublic, setIsPublic] = useState(false);

  const item = useMemo(() => {
    const base = fromInferenceResponse(response, { outputType });
    return { ...base, isPublic };
  }, [response, outputType, isPublic]);

  function handleTogglePublic() {
    if (!response.id) return;
    const newPublic = !isPublic;
    shareMutation.mutate(
      { id: response.id, isPublic: newPublic },
      {
        onSuccess: (result) => {
          setIsPublic(result.isPublic);
          toastSuccess(
            result.isPublic ? "Shared to gallery" : "Removed from gallery",
            result.isPublic
              ? "Anyone with the link can now view this result."
              : "This result is now private and hidden from the gallery."
          );
        },
        onError: (err) => {
          toastError("Sharing failed", {
            description: err.message,
            hint: "Check your connection and try again.",
          });
        },
      }
    );
  }

  if (response.error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {response.error}
      </div>
    );
  }

  return (
    <OutputView
      item={item}
      variant="inline"
      showMetadata
      showActions
      isOwner
      onTogglePublic={handleTogglePublic}
      isToggling={shareMutation.isPending}
    />
  );
}
