"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { KeyframeDialog } from "@/components/KeyframeDialog";
import { InitialStateDialog } from "@/components/InitialStateDialog";

import {
  Play,
  Pause,
  Square,
  Plus,
  ZoomIn,
  ZoomOut,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useTimelineStore,
  type Keyframe,
  type Transform,
} from "@/stores/timeline-store";

export function TimelineEditor() {
  const {
    timelines,
    activeTimelineId,
    addKeyframe,
    updateKeyframe,
    deleteKeyframe,
    isPlaying,
    setPlaying,
    currentTime,
    setCurrentTime,
    zoom,
    setZoom,
  } = useTimelineStore();

  // Memoize active timeline with stable dependencies
  const activeTimeline = useMemo(() => {
    return timelines.find((t) => t.id === activeTimelineId) || null;
  }, [timelines, activeTimelineId]);

  const [isKeyframeDialogOpen, setIsKeyframeDialogOpen] = useState(false);
  const [editingKeyframe, setEditingKeyframe] = useState<Keyframe | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [initialKeyframeData, setInitialKeyframeData] = useState({
    delay: 0,
    duration: 1000,
    easing: "power2.inOut",
    transforms: [] as Transform[],
  });

  const [isInitialStateDialogOpen, setIsInitialStateDialogOpen] =
    useState(false);

  // Drag and resize state
  const [dragOperation, setDragOperation] = useState<{
    type: "move" | "resize";
    keyframeId: string;
    startX: number;
    startDelay: number;
    startDuration: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [didDrag, setDidDrag] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  // activeTimeline is now memoized above

  // Memoize expensive calculations early to use in event handlers
  const getLastKeyframeEndMemo = useCallback(() => {
    if (!activeTimeline || activeTimeline.keyframes.length === 0) return 0;
    const lastKeyframe = activeTimeline.keyframes.reduce((latest, current) =>
      current.delay + current.duration / 1000 >
      latest.delay + latest.duration / 1000
        ? current
        : latest
    );
    return lastKeyframe.delay + lastKeyframe.duration / 1000;
  }, [activeTimeline?.keyframes]);

  const totalDuration = useMemo(
    () => getLastKeyframeEndMemo(),
    [getLastKeyframeEndMemo]
  );

  const timeMarkers = useMemo(() => {
    return Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => i);
  }, [totalDuration]);

  const timelineWidth = useMemo(() => {
    return totalDuration * 100 * zoom;
  }, [totalDuration, zoom]);

  // Handle mouse events for drag and resize
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, keyframe: Keyframe, type: "move" | "resize") => {
      e.stopPropagation();

      if (!timelineRef.current || !activeTimeline) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left;

      setDragOperation({
        type,
        keyframeId: keyframe.id,
        startX,
        startDelay: keyframe.delay,
        startDuration: keyframe.duration,
      });
      setIsDragging(true);
    },
    [activeTimeline]
  );

  // Helper function to snap value to grid with minimum step size
  const snapToGrid = (
    value: number,
    stepSize: number,
    isTime: boolean = false
  ) => {
    // Convert to ms for time values to ensure precision
    const valueInMs = isTime ? value * 1000 : value;
    const stepSizeInMs = isTime ? stepSize : stepSize;

    // Snap to nearest step with minimum of stepSize
    const snapped = Math.round(valueInMs / stepSizeInMs) * stepSizeInMs;

    // Convert back to seconds for time values
    return isTime ? snapped / 1000 : snapped;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !isDragging ||
        !dragOperation ||
        !timelineRef.current ||
        !activeTimeline
      ) {
        return;
      }

      const rect = timelineRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const deltaX = currentX - dragOperation.startX;

      // Convert pixel delta to time delta based on zoom level and total duration
      const pixelsPerSecond = rect.width / totalDuration;
      const timeDelta = deltaX / pixelsPerSecond;

      const keyframe = activeTimeline.keyframes.find(
        (k) => k.id === dragOperation.keyframeId
      );
      if (!keyframe) return;

      setDidDrag(true);

      // Minimum step size in milliseconds
      const minStepMs = 50;

      if (dragOperation.type === "move") {
        // Update delay (position) with snapping
        const rawNewDelay = Math.max(0, dragOperation.startDelay + timeDelta);
        // Snap to grid with minimum step of 50ms (0.05s)
        const newDelay = snapToGrid(rawNewDelay, minStepMs / 1000, true);
        updateKeyframe(activeTimeline.id, keyframe.id, { delay: newDelay });
      } else if (dragOperation.type === "resize") {
        // Update duration with snapping
        const rawNewDuration = Math.max(
          minStepMs,
          dragOperation.startDuration + timeDelta * 1000
        );
        // Snap to grid with minimum step of 50ms
        const newDuration = snapToGrid(rawNewDuration, minStepMs, false);
        updateKeyframe(activeTimeline.id, keyframe.id, {
          duration: newDuration,
        });
      }
    },
    [isDragging, dragOperation, activeTimeline, totalDuration, updateKeyframe]
  );

  const handleMouseUp = useCallback(() => {
    setDragOperation(null);
    setIsDragging(false);
    // Reset didDrag after a short delay to allow the click event to be suppressed
    setTimeout(() => setDidDrag(false), 0);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // getLastKeyframeEnd is now memoized as getLastKeyframeEndMemo above

  const handleSaveKeyframe = (keyframeData: {
    delay: number;
    duration: number;
    easing: string;
    transforms: Transform[];
  }) => {
    if (!activeTimeline) return;

    if (editingKeyframe) {
      updateKeyframe(activeTimeline.id, editingKeyframe.id, keyframeData);
    } else {
      addKeyframe(activeTimeline.id, keyframeData);
    }

    setEditingKeyframe(null);
    setIsKeyframeDialogOpen(false);
  };

  const handleEditKeyframe = (keyframe: Keyframe) => {
    setEditingKeyframe(keyframe);
    setDialogMode("edit");
    setIsKeyframeDialogOpen(true);
  };

  const handleAddKeyframe = () => {
    if (!activeTimeline) return;

    // Calculate delay to place new keyframe after the last existing keyframe
    const lastKeyframeEnd =
      activeTimeline.keyframes.length > 0
        ? Math.max(
            ...activeTimeline.keyframes.map((k) => k.delay + k.duration / 1000)
          )
        : 0;

    // Set initial data for new keyframe
    setInitialKeyframeData({
      delay: lastKeyframeEnd,
      duration: 1000,
      easing: "power2.inOut",
      transforms: [],
    });

    setEditingKeyframe(null);
    setDialogMode("add");
    setIsKeyframeDialogOpen(true);
  };

  const handleDialogCancel = () => {
    setEditingKeyframe(null);
    setIsKeyframeDialogOpen(false);
  };

  if (!activeTimeline) {
    return (
      <div className="text-center flex-1 flex items-center justify-center text-muted-foreground">
        There are no timelines to edit. <br />
        Create a new one or import an existing one to get started.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Controls */}
      <div className="border-b border-border p-4">
        <div className="flex justify-between items-center gap-4 max-w-[700px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isPlaying ? "outline" : "default"}
              onClick={() => setPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPlaying(false);
                setCurrentTime(0);
              }}
            >
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            </Button>
          </div>

          <Button
            size="sm"
            variant="default"
            className="gap-2"
            onClick={handleAddKeyframe}
          >
            <Plus className="h-4 w-4" />
            Add Keyframe
          </Button>
        </div>
      </div>

      {/* Unified Keyframe Dialog */}
      <KeyframeDialog
        isOpen={isKeyframeDialogOpen}
        onOpenChange={setIsKeyframeDialogOpen}
        mode={dialogMode}
        keyframe={editingKeyframe}
        keyframeNumber={
          editingKeyframe && activeTimeline
            ? activeTimeline.keyframes.findIndex(
                (k) => k.id === editingKeyframe.id
              ) + 1
            : undefined
        }
        initialData={dialogMode === "add" ? initialKeyframeData : undefined}
        onSave={handleSaveKeyframe}
        onCancel={handleDialogCancel}
      />

      {/* Timeline */}
      <div className="flex-1 p-4">
        {/* Fixed width container */}
        <div className="relative bg-muted/20 rounded-lg p-4 min-h-32 w-[700px] mx-auto">
          {/* Scrollable container with time markers */}
          <div className="overflow-x-auto">
            {/* Time markers container - positioned above timeline, scrolls with content */}
            <div
              className="relative h-6 mb-2"
              style={{ width: `${timelineWidth}px` }}
            >
              {timeMarkers.map((i) => (
                <div
                  key={i}
                  className="absolute top-0 h-6"
                  style={{ left: `${(i / totalDuration) * 100}%` }}
                >
                  <span className="absolute top-0 text-xs text-muted-foreground">
                    {i}s
                  </span>
                </div>
              ))}
            </div>

            {/* Initial State */}
            {activeTimeline.initialState && (
              <div
                className="absolute top-2 bottom-2 bg-blue-500/20 rounded hover:bg-blue-500/30 group cursor-pointer border-2 border-blue-500/40"
                style={{
                  left: "-90px",
                  width: "80px",
                }}
                onClick={() => setIsInitialStateDialogOpen(true)}
              >
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700">
                      Initial State
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xxs text-blue-600 font-medium bg-blue-500/10 px-1 rounded">
                      {activeTimeline.initialState.length} transforms
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Add Initial State Button */}
            {!activeTimeline.initialState && (
              <div
                className="absolute top-2 bottom-2 bg-transparent rounded hover:bg-primary/5 group cursor-pointer border-2 border-dashed border-primary/60"
                style={{
                  left: "-90px",
                  width: "80px",
                }}
                onClick={() => setIsInitialStateDialogOpen(true)}
              >
                <div className="p-2 h-full flex flex-col justify-center items-center">
                  <Plus className="h-4 w-4 text-primary mb-1" />
                  <span className="text-xs text-primary font-medium text-center">
                    Initial State
                  </span>
                </div>
              </div>
            )}

            {/* Timeline content that can expand beyond container */}
            <div
              ref={timelineRef}
              className="relative h-16 bg-card rounded border"
              style={{ width: `${timelineWidth}px` }}
            >
              {/* Time markers lines only */}
              <div className="absolute inset-0">
                {timeMarkers.map((i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-border/50"
                    style={{ left: `${(i / totalDuration) * 100}%` }}
                  />
                ))}
              </div>

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              />

              {/* Keyframes */}
              {activeTimeline.keyframes.map((keyframe) => (
                <div
                  key={keyframe.id}
                  className={`absolute top-2 bottom-2 bg-primary/20 rounded hover:bg-primary/30 hover:z-20 group ${
                    isDragging && dragOperation?.keyframeId === keyframe.id
                      ? "opacity-70"
                      : ""
                  }`}
                  style={{
                    left: `${(keyframe.delay / totalDuration) * 100}%`,
                    width: `${
                      (keyframe.duration / 1000 / totalDuration) * 100
                    }%`,
                    cursor: isDragging
                      ? dragOperation?.keyframeId === keyframe.id
                        ? dragOperation?.type === "move"
                          ? "grabbing"
                          : "ew-resize"
                        : "pointer"
                      : "pointer",
                  }}
                >
                  <div
                    className="h-full bg-primary/20 border border-primary rounded-lg cursor-grab active:cursor-grabbing relative group"
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const rightEdgeThreshold = 10; // pixels from right edge to trigger resize

                      if (e.clientX > rect.right - rightEdgeThreshold) {
                        handleMouseDown(e, keyframe, "resize");
                      } else {
                        handleMouseDown(e, keyframe, "move");
                      }
                    }}
                    onClick={() => {
                      if (didDrag) return;
                      handleEditKeyframe(keyframe);
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col p-1 overflow-hidden">
                      <div className="flex justify-start items-center">
                        <span
                          className="text-xxs font-medium text-primary"
                          suppressHydrationWarning
                        >
                          {keyframe.duration}ms / {keyframe.easing}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span
                          className="text-xxs text-primary font-medium bg-primary/10 px-1 rounded"
                          suppressHydrationWarning
                        >
                          {keyframe.transforms.length} transforms
                        </span>
                      </div>
                    </div>

                    {/* Resize handles */}
                    <div
                      className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) =>
                        handleMouseDown(e, keyframe, "resize")
                      }
                    />
                    <div
                      className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) =>
                        handleMouseDown(e, keyframe, "resize")
                      }
                    />
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeTimeline) {
                            deleteKeyframe(activeTimeline.id, keyframe.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KeyframeDialog */}
      <KeyframeDialog
        isOpen={isKeyframeDialogOpen}
        onOpenChange={setIsKeyframeDialogOpen}
        mode={dialogMode}
        keyframe={editingKeyframe}
        initialData={initialKeyframeData}
        onSave={handleSaveKeyframe}
        onCancel={handleDialogCancel}
      />

      {/* InitialStateDialog */}
      {activeTimeline && (
        <InitialStateDialog
          isOpen={isInitialStateDialogOpen}
          onOpenChange={setIsInitialStateDialogOpen}
          timelineId={activeTimeline.id}
        />
      )}
    </div>
  );
}
