"use client";

import { useCallback, useMemo, useState } from "react";
import { Code, ExternalLink, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HtmlExportPreviewOverlay } from "@/components/HtmlExportPreviewOverlay";
import { toast } from "react-toastify";
import { generateTimelineCode } from "@/lib/timeline-utils";
import {
  downloadTimelineHtml,
  generateTimelineHtml,
} from "@/lib/html-export";
import { useTimelineStore } from "@/stores/timeline-store";
import {
  DEFAULT_ABSOLUTE_SCROLL_END,
  inferScrollEndMode,
  resolveScrollEnd,
} from "@/lib/scroll-trigger-config";

export function PreviewToolbar() {
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId);
  const timelines = useTimelineStore((s) => s.timelines);
  const { updateTimeline, setPlaying } = useTimelineStore();

  const activeTimeline = useMemo(
    () => timelines.find((t) => t.id === activeTimelineId) ?? null,
    [timelines, activeTimelineId]
  );

  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  const handleExportCode = useCallback(() => {
    if (!activeTimeline) return;
    const code = generateTimelineCode(activeTimeline);
    navigator.clipboard.writeText(code);
    toast.success("GSAP Code copied to clipboard!");
  }, [activeTimeline]);

  const handleExportHtml = useCallback(() => {
    if (!activeTimeline) return;
    try {
      downloadTimelineHtml(activeTimeline);
      toast.success("File HTML scaricato.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export HTML non riuscito"
      );
    }
  }, [activeTimeline]);

  const handlePreviewExportedHtml = useCallback(() => {
    if (!activeTimeline) return;
    try {
      setHtmlPreview(generateTimelineHtml(activeTimeline));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Anteprima HTML non riuscita"
      );
    }
  }, [activeTimeline]);

  if (!activeTimeline) return null;

  const isScrollMode = activeTimeline.playbackType === "scroll";
  const scrollEndMode = inferScrollEndMode(
    activeTimeline.scrollTriggerEnd,
    activeTimeline.scrollEndMode
  );
  const scrollStartLabel =
    activeTimeline.scrollTriggerStart?.trim() || "top center";
  const scrollEndLabel = resolveScrollEnd(
    activeTimeline.scrollLength,
    activeTimeline.scrollTriggerEnd
  );

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-full overflow-x-auto scrollbar-none py-0.5">
        <Select
          value={activeTimeline.playbackType}
          onValueChange={(value: "normal" | "scroll") => {
            updateTimeline(activeTimeline.id, {
              playbackType: value,
              scrollLength:
                value === "scroll"
                  ? activeTimeline.scrollLength ?? 300
                  : undefined,
            });
            if (value === "scroll") {
              setPlaying(false);
              toast.info("Scroll: usa l'area preview per scrub.");
            }
          }}
        >
          <SelectTrigger className="w-[5.5rem] h-7 text-xxs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="scroll">Scroll</SelectItem>
          </SelectContent>
        </Select>

        {isScrollMode ? (
          <>
            <Select
              value={scrollEndMode}
              onValueChange={(value: "relative" | "absolute") => {
                if (value === "relative") {
                  updateTimeline(activeTimeline.id, {
                    scrollEndMode: "relative",
                    scrollTriggerEnd: undefined,
                    scrollLength: activeTimeline.scrollLength ?? 300,
                  });
                } else {
                  updateTimeline(activeTimeline.id, {
                    scrollEndMode: "absolute",
                    scrollTriggerEnd:
                      activeTimeline.scrollTriggerEnd?.trim() &&
                      !activeTimeline.scrollTriggerEnd.startsWith("+=")
                        ? activeTimeline.scrollTriggerEnd
                        : DEFAULT_ABSOLUTE_SCROLL_END,
                  });
                }
              }}
            >
              <SelectTrigger className="w-[6.5rem] h-7 text-xxs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relative">End += %</SelectItem>
                <SelectItem value="absolute">End assoluto</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="w-24 h-7 font-mono text-xxs"
              value={scrollStartLabel}
              title="GSAP start"
              onChange={(e) =>
                updateTimeline(activeTimeline.id, {
                  scrollTriggerStart: e.target.value,
                })
              }
            />
            <Input
              className="w-24 h-7 font-mono text-xxs"
              value={scrollEndLabel}
              title="GSAP end"
              onChange={(e) =>
                updateTimeline(activeTimeline.id, {
                  scrollTriggerEnd: e.target.value,
                  scrollLength: undefined,
                  scrollEndMode: e.target.value.trim().startsWith("+=")
                    ? "relative"
                    : "absolute",
                })
              }
            />
            {scrollEndMode === "relative" ? (
              <Input
                type="number"
                className="w-14 h-7 text-xxs"
                min={50}
                max={2000}
                title="Lunghezza scroll (%)"
                value={activeTimeline.scrollLength ?? 300}
                onChange={(e) =>
                  updateTimeline(activeTimeline.id, {
                    scrollLength: parseInt(e.target.value, 10) || 300,
                    scrollTriggerEnd: undefined,
                    scrollEndMode: "relative",
                  })
                }
              />
            ) : null}
          </>
        ) : null}

        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xxs"
          onClick={handlePreviewExportedHtml}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Preview qui
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xxs !border-primary !text-primary"
          onClick={handleExportCode}
        >
          <Code className="h-3.5 w-3.5" />
          Export GSAP
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xxs"
          onClick={handleExportHtml}
        >
          <FileCode2 className="h-3.5 w-3.5" />
          HTML
        </Button>
      </div>

      {htmlPreview ? (
        <HtmlExportPreviewOverlay
          html={htmlPreview}
          onClose={() => setHtmlPreview(null)}
        />
      ) : null}
    </>
  );
}