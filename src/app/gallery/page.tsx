import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export const metadata: Metadata = {
  title: "Gallery — WEBAI3",
  description:
    "Explore AI-generated images, text, and audio shared by the community.",
};

export default function GalleryPage() {
  return <GalleryGrid />;
}
