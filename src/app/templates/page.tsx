import type { Metadata } from "next";
import { TemplateGrid } from "@/components/templates/template-grid";

export const metadata: Metadata = {
  title: "Prompt Templates — WEBAI3",
  description:
    "Ready-to-use prompt templates for image generation, text creation, and audio synthesis.",
};

export default function TemplatesPage() {
  return <TemplateGrid />;
}
