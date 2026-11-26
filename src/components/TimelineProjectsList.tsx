"use client";

import { useState } from "react";
import { Copy, Trash2, Play, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TimelineProjectDialog } from "@/components/TimelineProjectDialog";
import { useTimelineStore } from "@/stores/timeline-store";

export function TimelineProjectsList() {
  const {
    timelines,
    activeTimelineId,
    addTimeline,
    updateTimeline,
    deleteTimeline,
    setActiveTimeline,
    generateUniqueTimelineName,
  } = useTimelineStore();

  const [editTimelineId, setEditTimelineId] = useState<string | null>(null);
  const editTimeline =
    timelines.find((t) => t.id === editTimelineId) ?? null;

  const handleDuplicateTimeline = (timelineId: string) => {
    const timeline = timelines.find((t) => t.id === timelineId);
    if (!timeline) return;

    const name = generateUniqueTimelineName(`${timeline.name} Copy`);

    addTimeline({
      name,
      playbackType: timeline.playbackType,
      scrollLength:
        timeline.playbackType === "scroll" ? timeline.scrollLength : undefined,
      scrollTriggerStart: timeline.scrollTriggerStart,
      scrollTriggerEnd: timeline.scrollTriggerEnd,
      scrollEndMode: timeline.scrollEndMode,
      loop: timeline.loop,
      yoyo: timeline.yoyo,
      previewBackground: timeline.previewBackground,
      previewGradientFrom: timeline.previewGradientFrom,
      previewGradientTo: timeline.previewGradientTo,
      previewGradientAngle: timeline.previewGradientAngle,
      previewBackgroundGradient: timeline.previewBackgroundGradient,
      boundsClass: timeline.boundsClass,
      stagePerspective: timeline.stagePerspective,
      keyframes: JSON.parse(JSON.stringify(timeline.keyframes)),
      targets: JSON.parse(JSON.stringify(timeline.targets ?? [])),
      activeTargetId: timeline.activeTargetId,
      initialStates: timeline.initialStates
        ? JSON.parse(JSON.stringify(timeline.initialStates))
        : undefined,
      targetShape: timeline.targetShape,
    });
  };

  if (timelines.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
        {timelines.map((timeline) => (
          <Card
            key={timeline.id}
            className={`shrink-0 gap-0 py-1 px-1.5 min-w-0 max-w-[11rem] cursor-pointer transition-colors rounded-md shadow-none ${
              activeTimelineId === timeline.id
                ? "bg-primary/10 border-primary"
                : "hover:bg-accent"
            }`}
            onClick={() => setActiveTimeline(timeline.id)}
            title={timeline.name}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1 flex items-center gap-1">
                <Play className="h-3 w-3 text-primary shrink-0" />
                <span className="font-medium text-xs truncate leading-tight">
                  {timeline.name}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  title="Impostazioni progetto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTimelineId(timeline.id);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              <div className="flex shrink-0 gap-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Duplica"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateTimeline(timeline.id);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  title="Elimina"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTimeline(timeline.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <TimelineProjectDialog
        open={editTimelineId !== null}
        onOpenChange={(open) => {
          if (!open) setEditTimelineId(null);
        }}
        timeline={editTimeline}
        onSave={(updates) => {
          if (!editTimelineId) return;
          updateTimeline(editTimelineId, updates);
        }}
      />
    </>
  );
}