"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PreviewArea } from "@/components/PreviewArea";
import { TimelineEditor } from "@/components/TimelineEditor";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "gsap-editor-timeline-panel-height";
const DEFAULT_HEIGHT_PX = 380;
const MIN_TIMELINE_PX = 160;
const MIN_PREVIEW_PX = 140;

function readStoredHeight(): number {
  if (typeof window === "undefined") return DEFAULT_HEIGHT_PX;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_HEIGHT_PX;
}

function maxTimelineHeight(): number {
  if (typeof window === "undefined") return 720;
  return Math.max(
    MIN_TIMELINE_PX,
    window.innerHeight - MIN_PREVIEW_PX - 120
  );
}

function clampHeight(px: number): number {
  return Math.min(maxTimelineHeight(), Math.max(MIN_TIMELINE_PX, px));
}

export function EditorPreviewSplit() {
  const [timelineHeight, setTimelineHeight] = useState(DEFAULT_HEIGHT_PX);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    setTimelineHeight(clampHeight(readStoredHeight()));
  }, []);

  useEffect(() => {
    const onResize = () => {
      setTimelineHeight((h) => clampHeight(h));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
      dragRef.current = { startY: e.clientY, startH: timelineHeight };

      const onMove = (ev: MouseEvent) => {
        const start = dragRef.current;
        if (!start) return;
        const delta = start.startY - ev.clientY;
        setTimelineHeight(clampHeight(start.startH + delta));
      };

      const onUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setTimelineHeight((h) => {
          const next = clampHeight(h);
          window.localStorage.setItem(STORAGE_KEY, String(Math.round(next)));
          return next;
        });
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [timelineHeight]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-hidden">
      <div className="flex flex-1 flex-col min-h-0 h-full overflow-hidden">
        <PreviewArea />
      </div>

      <div
        className={cn(
          "relative shrink-0 flex flex-col min-h-0 border-t border-border bg-card overflow-hidden",
          isResizing && "select-none"
        )}
        style={{ height: timelineHeight }}
      >
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Ridimensiona area timeline"
          title="Trascina per ridimensionare preview e timeline"
          className={cn(
            "absolute top-0 left-0 right-0 z-20 h-2 -translate-y-1/2 cursor-ns-resize",
            "flex items-center justify-center",
            "before:absolute before:inset-x-8 before:h-px before:bg-border",
            "hover:before:bg-primary/50 hover:bg-primary/5",
            isResizing && "before:bg-primary bg-primary/10"
          )}
          onMouseDown={onResizeStart}
        />
        <div className="flex flex-col flex-1 min-h-0 pt-1">
          <TimelineEditor />
        </div>
      </div>
    </div>
  );
}