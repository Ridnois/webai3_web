import type { Metadata } from "next";
import { InferencePageLayout } from "@/components/inference/inference-page-layout";

export const metadata: Metadata = {
  title: "Text to Text — web3-ai",
  description:
    "Generate, summarize, translate, or transform text with AI language models.",
};

export default function TextToTextPage() {
  return <InferencePageLayout task="text-to-text" />;
}
