"use client";

import { useQuery } from "@tanstack/react-query";
import type { InputField } from "@/types/task-config";
import type { ReplicateModel } from "@/types/inference";

interface ModelSchemaResponse {
  fields: InputField[];
}

async function fetchModelSchema(
  owner: string,
  name: string
): Promise<InputField[]> {
  const res = await fetch(
    `/api/models/schema?model=${encodeURIComponent(`${owner}/${name}`)}`
  );
  if (!res.ok) return [];
  const data: ModelSchemaResponse = await res.json();
  return data.fields;
}

export function useModelSchema(model: ReplicateModel | null) {
  return useQuery({
    queryKey: ["model-schema", model?.owner, model?.name],
    queryFn: () => fetchModelSchema(model!.owner, model!.name),
    enabled: !!model,
    staleTime: 5 * 60 * 1000,
  });
}
