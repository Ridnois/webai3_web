import { Suspense } from "react";
import type { Metadata } from "next";
import { InferencePageLayout } from "@/components/inference/inference-page-layout";

export const metadata: Metadata = {
  title: "Text to Image — web3-ai",
  description:
    "Generate images from text prompts using AI diffusion models.",
};

export default function TextToImagePage() {
  return (
    <Suspense>
      <InferencePageLayout task="text-to-image" />
    </Suspense>
  );
}
