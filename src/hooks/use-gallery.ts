"use client";

import { useQuery } from "@tanstack/react-query";

export interface GalleryItem {
  id: string;
  userAddress: string;
  taskType: string;
  model: string;
  input: Record<string, unknown>;
  outputType: string;
  outputData: unknown;
  r2Keys: string[] | null;
  mediaUrls: string[] | null;
  predictTimeMs: number | null;
  createdAt: string;
}

interface GalleryResponse {
  items: GalleryItem[];
  page: number;
  limit: number;
}

async function fetchGallery(page: number, task?: string): Promise<GalleryResponse> {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (task) params.set("task", task);

  const res = await fetch(`/api/gallery?${params}`);
  if (!res.ok) {
    throw new Error("Failed to fetch gallery");
  }
  return res.json();
}

export function useGallery(page: number, task?: string) {
  return useQuery({
    queryKey: ["gallery", page, task],
    queryFn: () => fetchGallery(page, task),
  });
}
