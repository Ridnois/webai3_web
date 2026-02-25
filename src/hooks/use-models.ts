import { useQuery } from "@tanstack/react-query";
import type { TaskType, ReplicateModel } from "@/types/inference";

async function fetchModels(task: TaskType): Promise<ReplicateModel[]> {
  const res = await fetch(`/api/models?task=${task}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to fetch models (${res.status})`);
  }
  return res.json();
}

export function useModels(task: TaskType) {
  return useQuery({
    queryKey: ["models", task],
    queryFn: () => fetchModels(task),
    staleTime: 5 * 60 * 1000,
  });
}
