import type { Metadata } from "next";
import { PublicResultView } from "@/components/gallery/public-result-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Fetch the public inference for OG tags
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/r/${id}`, { cache: "no-store" });
    if (!res.ok) {
      return { title: "Not Found — web3-ai" };
    }

    const data = await res.json();
    const prompt =
      typeof data.input?.prompt === "string"
        ? data.input.prompt.slice(0, 160)
        : "AI-generated content";

    const title = `${data.taskType === "text-to-image" ? "Image" : data.taskType === "text-to-sound" ? "Audio" : "Text"} by ${data.userAddress.slice(0, 6)}...${data.userAddress.slice(-4)} — web3-ai`;

    const meta: Metadata = {
      title,
      description: prompt,
      openGraph: {
        title,
        description: prompt,
        type: "website",
      },
    };

    // Add OG image for image outputs
    if (data.outputType === "image" && data.mediaUrls?.[0]) {
      meta.openGraph!.images = [{ url: data.mediaUrls[0] }];
    }

    return meta;
  } catch {
    return { title: "Shared Creation — web3-ai" };
  }
}

export default async function PublicResultPage({ params }: Props) {
  const { id } = await params;
  return <PublicResultView id={id} />;
}
