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
    <div className="flex h-full min-h-0 shrink-0">
      <div className="flex w-56 flex-col border-r border-border bg-card p-3 h-full min-h-0 overflow-hidden">
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
            Crea o seleziona un progetto.
          </p>
        )}
      </div>
    </div>
  );
}