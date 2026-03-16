import { Suspense } from "react";
import type { Metadata } from "next";
import { InferencePageLayout } from "@/components/inference/inference-page-layout";

export const metadata: Metadata = {
  title: "Text to Sound — WEBAI3",
  description:
    "Generate music, sound effects, or speech from text descriptions powered by AI.",
};

export default function TextToSoundPage() {
  return (
    <Suspense>
      <InferencePageLayout task="text-to-sound" />
    </Suspense>
  );
}
