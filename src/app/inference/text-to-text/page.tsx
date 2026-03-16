import { Suspense } from "react";
import type { Metadata } from "next";
import { InferencePageLayout } from "@/components/inference/inference-page-layout";

export const metadata: Metadata = {
  title: "Text to Text — WEBAI3",
  description:
    "Generate, summarize, translate, or transform text with AI language models.",
};

export default function TextToTextPage() {
  return (
    <Suspense>
      <InferencePageLayout task="text-to-text" />
    </Suspense>
  );
}
