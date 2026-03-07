import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export const metadata: Metadata = {
  title: "Gallery — web3-ai",
  description:
    "Explore AI-generated images, text, and audio shared by the community.",
};

export default function GalleryPage() {
  return <GalleryGrid />;
}
