import type { Metadata } from "next";
import { InferencePageLayout } from "@/components/inference/inference-page-layout";

export const metadata: Metadata = {
  title: "Text to Sound — web3-ai",
  description:
    "Generate music, sound effects, or speech from text descriptions powered by AI.",
};

export default function TextToSoundPage() {
  return <InferencePageLayout task="text-to-sound" />;
}
