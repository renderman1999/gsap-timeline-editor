"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_ABSOLUTE_SCROLL_END,
  formatScrollStart,
  inferScrollEndMode,
  parseScrollPosition,
  type ScrollEdge,
  type ScrollEndMode,
  triggerEdgeOffset,
} from "@/lib/scroll-trigger-config";
import { cn } from "@/lib/utils";

type ScrollTriggerVisualEditorProps = {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  scrollTriggerStart: string | undefined;
  scrollTriggerEnd: string | undefined;
  scrollEndMode: ScrollEndMode;
  scrollLength: number;
  onStartChange: (start: string) => void;
  onEndChange: (end: string) => void;
  onScrollLengthChange: (length: number) => void;
  onClearCustomEnd?: () => void;
};

export function ScrollTriggerTriggerEdges({
  variant,
  triggerEdge,
  onSelect,
}: {
  variant: "start" | "end";
  triggerEdge: ScrollEdge;
  onSelect: (edge: ScrollEdge) => void;
}) {
  const isStart = variant === "start";
  return (
    <div
      className={cn(
        "absolute z-30 flex flex-col gap-0.5",
        isStart ? "left-2 top-2" : "right-2 bottom-2 items-end"
      )}
    >
      <span
        className={cn(
          "text-[9px] font-medium uppercase px-1 rounded",
          isStart
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        )}
      >
        {isStart ? "trigger-start" : "trigger-end"}
      </span>
      <div className="flex gap-1">
        {(["top", "center", "bottom"] as const).map((edge) => (
          <button
            key={edge}
            type="button"
            className={cn(
              "text-[10px] uppercase px-2 py-0.5 rounded border bg-card/95",
              triggerEdge === edge
                ? isStart
                  ? "border-emerald-500 text-emerald-600"
                  : "border-red-500 text-red-600"
                : "border-border text-muted-foreground"
            )}
            onClick={() => onSelect(edge)}
          >
            {edge}
          </button>
        ))}
      </div>
    </div>
  );
}

function viewportPercentFromParsed(parsed: ReturnType<typeof parseScrollPosition>) {
  if (typeof parsed.viewport === "number") return parsed.viewport;
  return parsed.viewport === "top" ? 0 : parsed.viewport === "bottom" ? 100 : 50;
}

export function useScrollTriggerVisualState({
  scrollContainerRef,
  triggerRef,
  contentRef,
  scrollTriggerStart,
  scrollTriggerEnd,
  scrollEndMode,
  scrollLength,
  onStartChange,
  onEndChange,
  onScrollLengthChange,
  onClearCustomEnd,
}: ScrollTriggerVisualEditorProps) {
  const parsedStart = parseScrollPosition(scrollTriggerStart);
  const parsedEnd = parseScrollPosition(
    scrollEndMode === "absolute"
      ? scrollTriggerEnd ?? DEFAULT_ABSOLUTE_SCROLL_END
      : undefined
  );

  const [startTriggerEdge, setStartTriggerEdge] = useState<ScrollEdge>(
    parsedStart.trigger
  );
  const [startViewportPercent, setStartViewportPercent] = useState(() =>
    viewportPercentFromParsed(parsedStart)
  );
  const [endTriggerEdge, setEndTriggerEdge] = useState<ScrollEdge>(
    parsedEnd.trigger
  );
  const [endViewportPercent, setEndViewportPercent] = useState(() =>
    viewportPercentFromParsed(parsedEnd)
  );
  const [endContentY, setEndContentY] = useState<number | null>(null);
  const [scrollerHeight, setScrollerHeight] = useState(0);
  const [dragging, setDragging] = useState<
    "startViewport" | "endViewport" | "endContent" | null
  >(null);

  const startViewportRef = useRef(startViewportPercent);
  const endViewportRef = useRef(endViewportPercent);
  startViewportRef.current = startViewportPercent;
  endViewportRef.current = endViewportPercent;

  useEffect(() => {
    const p = parseScrollPosition(scrollTriggerStart);
    setStartTriggerEdge(p.trigger);
    setStartViewportPercent(viewportPercentFromParsed(p));
  }, [scrollTriggerStart]);

  useEffect(() => {
    if (scrollEndMode !== "absolute") return;
    const p = parseScrollPosition(
      scrollTriggerEnd ?? DEFAULT_ABSOLUTE_SCROLL_END
    );
    setEndTriggerEdge(p.trigger);
    setEndViewportPercent(viewportPercentFromParsed(p));
  }, [scrollTriggerEnd, scrollEndMode]);

  const measureEndFromScrollLength = useCallback(() => {
    const scroller = scrollContainerRef.current;
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!scroller || !trigger || !content) return;

    setScrollerHeight(scroller.clientHeight);

    if (scrollEndMode !== "relative") {
      setEndContentY(null);
      return;
    }

    const contentRect = content.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const triggerTopInContent =
      triggerRect.top - contentRect.top + scroller.scrollTop;
    const alignY =
      triggerTopInContent +
      triggerEdgeOffset(startTriggerEdge, trigger.offsetHeight);
    const nextY =
      alignY + (scrollLength / 100) * scroller.clientHeight;
    setEndContentY(nextY);
  }, [
    contentRef,
    scrollContainerRef,
    scrollEndMode,
    scrollLength,
    startTriggerEdge,
    triggerRef,
  ]);

  useEffect(() => {
    measureEndFromScrollLength();
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const ro = new ResizeObserver(() => measureEndFromScrollLength());
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [measureEndFromScrollLength, scrollContainerRef]);

  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const onScroll = () => measureEndFromScrollLength();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [measureEndFromScrollLength, scrollContainerRef]);

  const commitStart = useCallback(
    (edge: ScrollEdge, viewport: number) => {
      onStartChange(formatScrollStart(edge, viewport));
    },
    [onStartChange]
  );

  const commitEndAbsolute = useCallback(
    (edge: ScrollEdge, viewport: number) => {
      onEndChange(formatScrollStart(edge, viewport));
    },
    [onEndChange]
  );

  const commitScrollLengthFromEndY = useCallback(
    (endY: number) => {
      const scroller = scrollContainerRef.current;
      const trigger = triggerRef.current;
      const content = contentRef.current;
      if (!scroller || !trigger || !content) return;

      const contentRect = content.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const triggerTopInContent =
        triggerRect.top - contentRect.top + scroller.scrollTop;
      const alignY =
        triggerTopInContent +
        triggerEdgeOffset(startTriggerEdge, trigger.offsetHeight);
      const delta = Math.max(endY - alignY, scroller.clientHeight * 0.2);
      const length = Math.round((delta / scroller.clientHeight) * 100);
      onClearCustomEnd?.();
      onScrollLengthChange(Math.min(2000, Math.max(50, length)));
    },
    [
      contentRef,
      onClearCustomEnd,
      onScrollLengthChange,
      scrollContainerRef,
      startTriggerEdge,
      triggerRef,
    ]
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const scroller = scrollContainerRef.current;
      const content = contentRef.current;
      if (!scroller) return;

      const rect = scroller.getBoundingClientRect();
      const pct =
        ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      const clamped = Math.min(100, Math.max(0, pct));

      if (dragging === "startViewport") {
        setStartViewportPercent(clamped);
        startViewportRef.current = clamped;
      }

      if (dragging === "endViewport") {
        setEndViewportPercent(clamped);
        endViewportRef.current = clamped;
      }

      if (dragging === "endContent" && content) {
        const contentRect = content.getBoundingClientRect();
        const y = e.clientY - contentRect.top + scroller.scrollTop;
        const minY = scroller.clientHeight * 0.3;
        setEndContentY(Math.max(minY, y));
      }
    };

    const onUp = () => {
      if (dragging === "startViewport") {
        commitStart(startTriggerEdge, startViewportRef.current);
      }
      if (dragging === "endViewport") {
        commitEndAbsolute(endTriggerEdge, endViewportRef.current);
      }
      if (dragging === "endContent" && endContentY !== null) {
        commitScrollLengthFromEndY(endContentY);
      }
      setDragging(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [
    commitEndAbsolute,
    commitScrollLengthFromEndY,
    commitStart,
    contentRef,
    dragging,
    endContentY,
    endTriggerEdge,
    scrollContainerRef,
    startTriggerEdge,
  ]);

  const selectStartTriggerEdge = useCallback(
    (edge: ScrollEdge) => {
      setStartTriggerEdge(edge);
      commitStart(edge, startViewportPercent);
    },
    [commitStart, startViewportPercent]
  );

  const selectEndTriggerEdge = useCallback(
    (edge: ScrollEdge) => {
      setEndTriggerEdge(edge);
      commitEndAbsolute(edge, endViewportPercent);
    },
    [commitEndAbsolute, endViewportPercent]
  );

  return {
    scrollEndMode,
    startTriggerEdge,
    endTriggerEdge,
    selectStartTriggerEdge,
    selectEndTriggerEdge,
    startViewportPercent,
    endViewportPercent,
    scrollerHeight,
    endContentY,
    setDragging,
  };
}

export function ScrollTriggerViewportOverlay({
  startViewportPercent,
  endViewportPercent,
  scrollEndMode,
  scrollerHeight,
  onStartDrag,
  onEndViewportDrag,
}: {
  startViewportPercent: number;
  endViewportPercent: number;
  scrollEndMode: ScrollEndMode;
  scrollerHeight: number;
  onStartDrag: () => void;
  onEndViewportDrag: () => void;
}) {
  if (scrollerHeight <= 0) return null;

  return (
    <div
      className="sticky top-0 left-0 right-0 z-20 pointer-events-none"
      style={{ height: scrollerHeight }}
    >
      <div
        className="absolute left-0 right-0 border-t-2 border-emerald-500 pointer-events-auto cursor-ns-resize"
        style={{ top: `${startViewportPercent}%` }}
        onPointerDown={(e) => {
          e.preventDefault();
          onStartDrag();
        }}
      >
        <span className="absolute left-2 -top-5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-card/90 px-1.5 rounded whitespace-nowrap">
          scroller-start
        </span>
      </div>

      {scrollEndMode === "absolute" ? (
        <div
          className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-auto cursor-ns-resize"
          style={{ top: `${endViewportPercent}%` }}
          onPointerDown={(e) => {
            e.preventDefault();
            onEndViewportDrag();
          }}
        >
          <span className="absolute right-2 -top-5 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-card/90 px-1.5 rounded whitespace-nowrap">
            scroller-end
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function ScrollTriggerEndLine({
  endContentY,
  scrollLength,
  onDragStart,
}: {
  endContentY: number | null;
  scrollLength: number;
  onDragStart: () => void;
}) {
  if (endContentY === null) return null;

  return (
    <div
      className="absolute left-0 right-0 border-t-2 border-red-500 border-dashed z-10 pointer-events-auto cursor-ns-resize"
      style={{ top: `${endContentY}px` }}
      onPointerDown={(e) => {
        e.preventDefault();
        onDragStart();
      }}
    >
      <span className="absolute right-2 -top-5 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-card/90 px-1.5 rounded whitespace-nowrap">
        scroller-end (+{scrollLength}%)
      </span>
    </div>
  );
}