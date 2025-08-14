"use client";

import { useRef } from "react";
import Link from "next/link";
import { Star, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimelineStore } from "@/stores/timeline-store";
import { downloadTimelines, importTimelines } from "@/lib/timeline-utils";
import { toast } from "react-toastify";

export function Header() {
  const { timelines, addTimeline } = useTimelineStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      downloadTimelines(timelines);
      toast.success("Timelines exported successfully!");
    } catch (error) {
      toast.error(`Failed to export timelines: ${error}`);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedTimelines = importTimelines(content);

        importedTimelines.forEach((timeline) => {
          // Generate new ID to avoid conflicts
          const { id, ...timelineWithoutId } = timeline;
          console.log(`importing timeline ${id}...`);
          addTimeline(timelineWithoutId);
        });

        toast.success(`Imported ${importedTimelines.length} timeline(s)`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to import timelines"
        );
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            <i>Timeline Editor for GSAP</i>
            <span className="text-xs text-muted-foreground ml-2">v1.2</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Create complex GSAP animations visually. Share and export final code
            in one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleImport}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>

          <Link
            href="https://github.com/DymytriiDev/gsap-timeline-editor"
            target="_blank"
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <Star className="h-4 w-4" />
              Star on GitHub
            </Button>
          </Link>
          {/* <Button variant="ghost" size="sm" className="gap-2">
            <CircleDollarSign className="h-4 w-4" />
            Buy me a coffee
          </Button> */}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </header>
  );
}
