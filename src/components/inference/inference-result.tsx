"use client";

import { useState, useMemo } from "react";
import type { InferenceResponse } from "@/types/inference";
import type { OutputType } from "@/types/task-config";
import { useShareInference, shareToggleCallbacks } from "@/hooks/use-share-inference";
import { fromInferenceResponse } from "@/types/output-item";
import { OutputView } from "@/components/output/output-view";
import { ErrorAlert } from "@/components/ui/error-alert";

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
    shareMutation.mutate(
      { id: response.id, isPublic: !isPublic },
      shareToggleCallbacks((result) => setIsPublic(result.isPublic)),
    );
  }

  if (response.error) {
    return (
      <ErrorAlert>{response.error}</ErrorAlert>
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
