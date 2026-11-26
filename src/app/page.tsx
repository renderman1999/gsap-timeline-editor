import { Header } from "@/components/Header";
import { TimelinesSidebar } from "@/components/TimelinesSidebar";
import { EditorPreviewSplit } from "@/components/EditorPreviewSplit";
import { TimelineStoreHydration } from "@/components/TimelineStoreHydration";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline Editor for GSAP",
  description:
    "Create, edit, and preview preview complex GSAP animations with ease using this visual editor. Share and export final code in one click.",
};

export default function Home() {
  return (
    <TimelineStoreHydration>
      <div className="h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <TimelinesSidebar />
          <EditorPreviewSplit />
        </div>
      </div>
    </TimelineStoreHydration>
  );
}
