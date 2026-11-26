"use client";

import { useMemo } from "react";
import { normalizeTimeline } from "@/lib/timeline-migrate";
import { LayersPanel } from "@/components/LayersPanel";
import { useTimelineStore } from "@/stores/timeline-store";

export function TimelinesSidebar() {
  const { timelines, activeTimelineId } = useTimelineStore();

  const activeTimeline = useMemo(() => {
    const raw = timelines.find((t) => t.id === activeTimelineId);
    return raw ? normalizeTimeline(raw) : null;
  }, [timelines, activeTimelineId]);

  return (
    <div className="w-56 shrink-0 border-r border-border bg-card p-3 flex flex-col h-full min-h-0 overflow-hidden">
      {activeTimeline ? (
        <div
          className="flex-1 min-h-0 overflow-y-auto scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          <LayersPanel
            timelineId={activeTimeline.id}
            targets={activeTimeline.targets}
            activeTargetId={activeTimeline.activeTargetId}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Crea o seleziona un progetto dall&apos;header.
        </p>
      )}
    </div>
  );
}