import { ImagePlus, MessageSquareText, AudioLines } from "lucide-react";

export const TASK_ICONS: Record<string, typeof ImagePlus> = {
  "text-to-image": ImagePlus,
  "text-to-text": MessageSquareText,
  "text-to-sound": AudioLines,
};

export const TASK_LABELS: Record<string, string> = {
  "text-to-image": "Text to Image",
  "text-to-text": "Text to Text",
  "text-to-sound": "Text to Sound",
};

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function shortTimeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function getPrompt(input: Record<string, unknown> | undefined | null): string | null {
  if (input && typeof input.prompt === "string") return input.prompt;
  return null;
}
