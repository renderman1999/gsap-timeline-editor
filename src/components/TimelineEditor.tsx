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
  BookmarkPlus,
} from "lucide-react";
import { TimelineLabelTrack } from "@/components/TimelineLabelTrack";
import {
  resolveLabelPositionTime,
  sanitizeTimelineLabelName,
} from "@/lib/gsap-labels";
import { roundDelay } from "@/utils/round";
import { Button } from "@/components/ui/button";
import {
  useTimelineStore,
  type Keyframe,
  type Transform,
} from "@/stores/timeline-store";
import { normalizeTimeline } from "@/lib/timeline-migrate";

const TRACK_BAR_GRADIENTS = [
  "linear-gradient(90deg, #6dff5c 0%, #e8ff7a 100%)",
  "linear-gradient(90deg, #1ec8ff 0%, #e7fbff 100%)",
  "linear-gradient(90deg, #ff7a18 0%, #ffd0ea 100%)",
  "linear-gradient(90deg, #b388ff 0%, #f3c4ff 100%)",
];

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
    recreateDemo,
    getActiveTimeline,
    setActiveTarget,
    updateTimeline,
  } = useTimelineStore();

  const activeTimeline = useMemo(() => {
    const raw = timelines.find((t) => t.id === activeTimelineId);
    if (!raw) return null;
    if (raw.targets?.length) return raw;
    return normalizeTimeline(raw);
  }, [timelines, activeTimelineId]);

  const [isKeyframeDialogOpen, setIsKeyframeDialogOpen] = useState(false);
  const [editingKeyframe, setEditingKeyframe] = useState<Keyframe | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [initialKeyframeData, setInitialKeyframeData] = useState({
    targetId: "",
    delay: 0,
    duration: 1000,
    easing: "power2.inOut",
    transforms: [] as Transform[],
  });

  const [isInitialStateDialogOpen, setIsInitialStateDialogOpen] =
    useState(false);
  const [initialStateTargetId, setInitialStateTargetId] = useState<
    string | null
  >(null);

  // Drag and resize state
  const [dragOperation, setDragOperation] = useState<{
    type: "move" | "resize";
    keyframeId: string;
    startX: number;
    startDelay: number;
    startDuration: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlayheadDragging, setIsPlayheadDragging] = useState(false);
  const [didDrag, setDidDrag] = useState(false);

  const trackRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const timelineVerticalRef = useRef<HTMLDivElement>(null);
  const safeTotalDurationRef = useRef(0.001);

  // Memoize expensive calculations early to use in event handlers
  const getLastKeyframeEndMemo = useCallback(() => {
    if (!activeTimeline) return 0;
    const lastKeyframe = activeTimeline.keyframes.reduce<number>((max, current) => {
      const start =
        resolveLabelPositionTime(current.position, activeTimeline.labels) ??
        current.delay;
      return Math.max(max, start + current.duration / 1000);
    }, 0);
    const labelEnd = (activeTimeline.labels ?? []).reduce(
      (max, label) => Math.max(max, label.time),
      0
    );
    return Math.max(lastKeyframe, labelEnd);
  }, [activeTimeline]);

  const totalDuration = useMemo(
    () => getLastKeyframeEndMemo(),
    [getLastKeyframeEndMemo]
  );

  const safeTotalDuration = Math.max(totalDuration, 0.001);
  safeTotalDurationRef.current = safeTotalDuration;

  const timeMarkers = useMemo(() => {
    return Array.from(
      { length: Math.ceil(safeTotalDuration) + 1 },
      (_, i) => i
    );
  }, [safeTotalDuration]);

  const contentTimelineWidth = useMemo(() => {
    return safeTotalDuration * 100 * zoom;
  }, [safeTotalDuration, zoom]);

  const timelineWidth = useMemo(
    () => Math.max(contentTimelineWidth, 240),
    [contentTimelineWidth]
  );

  useEffect(() => {
    const vertical = timelineVerticalRef.current;
    if (!vertical) return;

    const onWheel = (e: WheelEvent) => {
      const horizontal = scrollViewportRef.current;
      const canScrollVert =
        vertical.scrollHeight > vertical.clientHeight + 1;
      const canScrollHor =
        !!horizontal &&
        horizontal.scrollWidth > horizontal.clientWidth + 1;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (e.shiftKey && canScrollHor && horizontal) {
        e.preventDefault();
        horizontal.scrollLeft += e.deltaY;
        return;
      }

      if (canScrollVert && absY >= absX && absY > 0) {
        e.preventDefault();
        vertical.scrollTop += e.deltaY;
        return;
      }

      if (canScrollHor && horizontal && absX > absY && absX > 0) {
        e.preventDefault();
        horizontal.scrollLeft += e.deltaX;
      }
    };

    vertical.addEventListener("wheel", onWheel, { passive: false });
    return () => vertical.removeEventListener("wheel", onWheel);
  }, [activeTimelineId]);

  const resolvePlayheadTrack = useCallback((): HTMLDivElement | null => {
    if (!activeTimeline) return null;
    const activeTrack = trackRefs.current.get(activeTimeline.activeTargetId);
    if (activeTrack) return activeTrack;
    const first = trackRefs.current.values().next().value;
    return first ?? null;
  }, [activeTimeline]);

  const updatePlayheadFromClientX = useCallback(
    (clientX: number) => {
      const trackEl = resolvePlayheadTrack();
      if (!trackEl) return;

      const rect = trackEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const nextTime = (x / rect.width) * safeTotalDuration;
      const snapped = snapToGrid(nextTime, 0.05, true);
      setCurrentTime(Math.max(0, Math.min(safeTotalDuration, snapped)));
    },
    [resolvePlayheadTrack, safeTotalDuration, setCurrentTime]
  );

  const handlePlayheadMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPlaying(false);
      setIsPlayheadDragging(true);
      updatePlayheadFromClientX(e.clientX);
    },
    [setPlaying, updatePlayheadFromClientX]
  );

  const handleKeyframeDragStart = useCallback(
    (
      e: React.MouseEvent,
      keyframe: Keyframe,
      type: "move" | "resize",
      trackId: string
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const timeline = getActiveTimeline();
      if (!timeline) return;
      const trackEl = trackRefs.current.get(trackId);
      if (!trackEl) return;

      const timelineId = timeline.id;
      const keyframeId = keyframe.id;
      const startClientX = e.clientX;
      const startDelay = keyframe.delay;
      const startDuration = keyframe.duration;
      const minStepMs = 50;

      setDragOperation({
        type,
        keyframeId,
        startX: startClientX,
        startDelay,
        startDuration,
      });
      setIsDragging(true);

      const onMove = (ev: MouseEvent) => {
        const track = trackRefs.current.get(trackId);
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const total = safeTotalDurationRef.current;
        if (total <= 0) return;
        const pixelsPerSecond = rect.width / total;
        const timeDelta = (ev.clientX - startClientX) / pixelsPerSecond;

        setDidDrag(true);

        if (type === "move") {
          const rawNewDelay = Math.max(0, startDelay + timeDelta);
          const newDelay = snapToGrid(rawNewDelay, minStepMs / 1000, true);
          updateKeyframe(timelineId, keyframeId, { delay: newDelay });
        } else {
          const rawNewDuration = Math.max(
            minStepMs,
            startDuration + timeDelta * 1000
          );
          const newDuration = snapToGrid(rawNewDuration, minStepMs, false);
          updateKeyframe(timelineId, keyframeId, { duration: newDuration });
        }
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setDragOperation(null);
        setIsDragging(false);
        setTimeout(() => setDidDrag(false), 0);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getActiveTimeline, updateKeyframe]
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
      if (!isPlayheadDragging) return;
      updatePlayheadFromClientX(e.clientX);
    },
    [isPlayheadDragging, updatePlayheadFromClientX]
  );

  const handleMouseUp = useCallback(() => {
    setIsPlayheadDragging(false);
  }, []);

  useEffect(() => {
    if (!isPlayheadDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPlayheadDragging, handleMouseMove, handleMouseUp]);

  // getLastKeyframeEnd is now memoized as getLastKeyframeEndMemo above

  const handleSaveKeyframe = (keyframeData: Omit<Keyframe, "id">) => {
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

  const handleAddLabel = () => {
    if (!activeTimeline) return;
    const labels = activeTimeline.labels ?? [];
    const taken = new Set(labels.map((label) => label.name));
    let index = labels.length + 1;
    let name = `label${index}`;
    while (taken.has(name)) {
      index += 1;
      name = `label${index}`;
    }
    updateTimeline(activeTimeline.id, {
      labels: [
        ...labels,
        {
          id: Math.random().toString(36).substr(2, 9),
          name,
          time: roundDelay(Math.max(0, currentTime)),
        },
      ],
    });
  };

  const handleMoveLabel = (id: string, time: number) => {
    if (!activeTimeline) return;
    updateTimeline(activeTimeline.id, {
      labels: (activeTimeline.labels ?? []).map((label) =>
        label.id === id ? { ...label, time: roundDelay(Math.max(0, time)) } : label
      ),
    });
  };

  const handleRenameLabel = (id: string, name: string) => {
    if (!activeTimeline) return;
    const nextName = sanitizeTimelineLabelName(name);
    if (!nextName) return;
    const labels = activeTimeline.labels ?? [];
    if (labels.some((label) => label.id !== id && label.name === nextName)) return;
    updateTimeline(activeTimeline.id, {
      labels: labels.map((label) =>
        label.id === id ? { ...label, name: nextName } : label
      ),
    });
  };

  const handleRemoveLabel = (id: string) => {
    if (!activeTimeline) return;
    const labels = (activeTimeline.labels ?? []).filter((label) => label.id !== id);
    updateTimeline(activeTimeline.id, {
      labels: labels.length > 0 ? labels : undefined,
    });
  };

  const handleAddKeyframe = () => {
    if (!activeTimeline) return;

    // Calculate delay to place new keyframe after the last existing keyframe
    const layerKeyframes = activeTimeline.keyframes.filter(
      (k) => k.targetId === activeTimeline.activeTargetId
    );
    const lastKeyframeEnd =
      layerKeyframes.length > 0
        ? Math.max(
            ...layerKeyframes.map((k) => k.delay + k.duration / 1000)
          )
        : 0;

    setInitialKeyframeData({
      targetId: activeTimeline.activeTargetId,
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

  const isScrollPlayback = activeTimeline?.playbackType === "scroll";

  if (!activeTimeline) {
    return (
      <div className="text-center flex-1 min-h-0 px-4 py-8 flex flex-col items-center justify-center text-muted-foreground gap-4">
        <div>
          Nessun progetto selezionato. <br />
          Crea un nuovo progetto o importa un progetto esistente per iniziare.
        </div>
        <Button onClick={recreateDemo} variant="outline">
          Apri demo
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full min-w-0 bg-card">
      {/* Controls */}
      <div className="shrink-0 border-b border-border px-2 py-2 w-full">
        <div className="flex justify-between items-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              title="Zoom out timeline"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span
              className="text-sm text-muted-foreground tabular-nums min-w-[3rem] text-center"
              title="Larghezza timeline (100px ≈ 1s a zoom 100%)"
            >
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              title="Zoom in timeline"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            {isScrollPlayback ? (
              <span className="text-xs text-muted-foreground max-w-[140px]">
              </span>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="gap-2" onClick={handleAddKeyframe}>
              <Plus className="h-4 w-4" />
              Add Keyframe
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleAddLabel}
            >
              <BookmarkPlus className="h-4 w-4" />
              Label
            </Button>
          </div>
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
        targets={activeTimeline.targets}
        initialData={dialogMode === "add" ? initialKeyframeData : undefined}
        onSave={handleSaveKeyframe}
        onCancel={handleDialogCancel}
        labelNames={(activeTimeline.labels ?? []).map((label) => label.name)}
      />

      {/* Timeline */}
      <div
        ref={timelineVerticalRef}
        className="flex-1 min-h-0 px-4 pt-2 pb-0 w-full min-w-0 overflow-y-auto scrollbar-none"
      >
        <div className="relative bg-[#141414] text-neutral-200 rounded-t-lg p-4 pb-3 min-h-32 w-full">
          <div ref={scrollViewportRef} className="w-full overflow-x-auto">
            <div
              className="relative"
              style={{ width: `${timelineWidth + 88}px` }}
            >
              <div
                className="relative h-8 mb-1 ml-[88px]"
                style={{ width: `${timelineWidth}px` }}
              >
                {timeMarkers.map((i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full"
                    style={{ left: `${(i / safeTotalDuration) * 100}%` }}
                  >
                    <span className="absolute top-1 left-0 h-3 w-px bg-white/35" />
                    <span className="absolute top-0 left-1.5 text-[10px] tabular-nums text-neutral-400">
                      {i}
                    </span>
                  </div>
                ))}
                <TimelineLabelTrack
                  labels={activeTimeline.labels ?? []}
                  duration={safeTotalDuration}
                  onSeek={setCurrentTime}
                  onMove={handleMoveLabel}
                  onRename={handleRenameLabel}
                  onRemove={handleRemoveLabel}
                />
              </div>

              {activeTimeline.targets.map((target, layerIndex) => {
                const layerInitial = activeTimeline.initialStates?.[target.id];
                const layerKeyframes = activeTimeline.keyframes.filter(
                  (k) => k.targetId === target.id
                );
                const isActiveLayer =
                  target.id === activeTimeline.activeTargetId;

                return (
                  <div key={target.id} className="flex gap-2 mb-1.5 items-stretch">
                    <div
                      className={`w-20 shrink-0 flex flex-col gap-1 ${
                        isActiveLayer ? "opacity-100" : "opacity-70"
                      }`}
                    >
                      <button
                        type="button"
                        className="text-left text-xxs font-medium truncate text-neutral-100 hover:underline"
                        onClick={() =>
                          setActiveTarget(activeTimeline.id, target.id)
                        }
                        title="Layer attivo per nuovi keyframe"
                      >
                        {target.name}
                        {target.timePlayback ? " · tempo" : ""}
                      </button>
                      {layerInitial?.length ? (
                          <button
                            type="button"
                            className="h-8 w-full bg-sky-400/15 rounded hover:bg-sky-400/25 border border-sky-300/40 text-left cursor-pointer"
                            onClick={() => {
                              setInitialStateTargetId(target.id);
                              setIsInitialStateDialogOpen(true);
                            }}
                          >
                            <div className="p-1.5 h-full flex flex-col justify-between">
                              <span className="text-[10px] font-medium text-sky-100">
                                Initial
                              </span>
                              <span className="text-[10px] text-sky-200">
                                {layerInitial.length}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="h-8 w-full border border-dashed border-white/25 rounded hover:bg-white/5 cursor-pointer flex items-center justify-center gap-1"
                            onClick={() => {
                              setInitialStateTargetId(target.id);
                              setIsInitialStateDialogOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 text-neutral-300" />
                            <span className="text-[10px] text-neutral-300">Initial</span>
                          </button>
                        )}
                    </div>

                    <div
                      ref={(el) => {
                        if (el) trackRefs.current.set(target.id, el);
                        else trackRefs.current.delete(target.id);
                      }}
                      className="relative h-9 bg-[#222] rounded-sm flex-1"
                      style={{ width: `${timelineWidth}px` }}
                    >
                      <div className="absolute inset-0 pointer-events-none">
                        {timeMarkers.map((i) => (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 border-l border-white/10"
                            style={{
                              left: `${(i / safeTotalDuration) * 100}%`,
                            }}
                          />
                        ))}
                        {(activeTimeline.labels ?? []).map((label) => (
                          <div
                            key={label.id}
                            className="absolute top-0 bottom-0 border-l border-amber-500/80 z-10"
                            style={{
                              left: `${(label.time / safeTotalDuration) * 100}%`,
                            }}
                          />
                        ))}
                      </div>

                      {layerKeyframes.map((keyframe) => (
                        <div
                          key={keyframe.id}
                          className={`absolute top-1 bottom-1 rounded-full z-20 pointer-events-auto group ${
                            isDragging &&
                            dragOperation?.keyframeId === keyframe.id
                              ? "opacity-70"
                              : ""
                          }`}
                          style={{
                            left: `${
                              ((resolveLabelPositionTime(
                                keyframe.position,
                                activeTimeline.labels
                              ) ?? keyframe.delay) /
                                safeTotalDuration) *
                              100
                            }%`,
                            width: `${
                              (keyframe.duration / 1000 / safeTotalDuration) *
                              100
                            }%`,
                          }}
                        >
                          <div
                            className="h-full rounded-full cursor-grab active:cursor-grabbing relative shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                            style={{
                              background:
                                TRACK_BAR_GRADIENTS[
                                  layerIndex % TRACK_BAR_GRADIENTS.length
                                ],
                            }}
                            onMouseDown={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const rightEdgeThreshold = 14;
                              const mode =
                                e.clientX > rect.right - rightEdgeThreshold
                                  ? "resize"
                                  : "move";
                              handleKeyframeDragStart(
                                e,
                                keyframe,
                                mode,
                                target.id
                              );
                            }}
                            onClick={() => {
                              if (didDrag) return;
                              handleEditKeyframe(keyframe);
                            }}
                          >
                            <div
                              className="absolute top-0 right-0 bottom-0 w-3 z-10 cursor-ew-resize rounded-r-full bg-black/15 hover:bg-black/25"
                              title="Trascina per cambiare durata"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleKeyframeDragStart(
                                  e,
                                  keyframe,
                                  "resize",
                                  target.id
                                );
                              }}
                            />
                            <div className="absolute inset-0 flex flex-col p-1 overflow-hidden pointer-events-none">
                              <span
                                className="text-[10px] font-medium text-neutral-900/80"
                                suppressHydrationWarning
                              >
                                {keyframe.duration}ms / {keyframe.easing}
                                {keyframe.position ? ` @ ${keyframe.position}` : ""}
                              </span>
                              <span
                                className="text-[10px] text-neutral-900/70 w-fit"
                                suppressHydrationWarning
                              >
                                {keyframe.transforms.length} tr.
                              </span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-0 right-3.5 h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteKeyframe(
                                  activeTimeline.id,
                                  keyframe.id
                                );
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none ml-[88px]"
                style={{ width: `${timelineWidth}px` }}
              >
                <button
                  type="button"
                  aria-label="Trascina playhead"
                  className="absolute top-0 bottom-0 -translate-x-1/2 w-4 cursor-ew-resize pointer-events-auto touch-none"
                  style={{
                    left: `${(currentTime / safeTotalDuration) * 100}%`,
                  }}
                  onMouseDown={handlePlayheadMouseDown}
                >
                  <span className="absolute left-1/2 top-3 bottom-0 w-px -translate-x-1/2 bg-[#f3e6c5]" />
                  <span className="absolute left-1/2 top-0.5 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[#f3e6c5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTimeline && initialStateTargetId ? (
        <InitialStateDialog
          isOpen={isInitialStateDialogOpen}
          onOpenChange={(open) => {
            setIsInitialStateDialogOpen(open);
            if (!open) setInitialStateTargetId(null);
          }}
          timelineId={activeTimeline.id}
          targetId={initialStateTargetId}
          layerName={
            activeTimeline.targets.find(
              (t) => t.id === initialStateTargetId
            )?.name
          }
        />
      ) : null}
    </div>
  );
}
