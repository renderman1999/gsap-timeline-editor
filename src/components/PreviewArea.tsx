"use client";

import { useRef, useMemo, useEffect } from "react";
import { normalizeTimeline } from "@/lib/timeline-migrate";
import { gsap } from "gsap";
import type { Draggable } from "gsap/Draggable";
import type { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { registerPreviewGsapPlugins } from "@/lib/gsap-register-preview";
import { useTimelineStore } from "@/stores/timeline-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  appendTweenStepsToTimeline,
  applyInitialStateToTarget,
  buildTweenSteps,
  getTimelineGsapOptions,
  measureSvgPath,
  primeSvgPluginState,
  resolveSvgPathElement,
} from "@/lib/gsap-build";
import { targetHasSvgPluginKeyframes } from "@/lib/gsap-svg-plugins";
import {
  createSplitTextForPreview,
  isActiveTextSplit,
  resolvePreviewTextElement,
  splitTweenTarget,
} from "@/lib/gsap-split-text";
import { GoogleFontsLoader } from "@/components/GoogleFontsLoader";
import { MotionPathGuide } from "@/components/MotionPathGuide";
import { PreviewTargetView } from "@/components/PreviewTargetView";
import {
  collectCssRuleStylesheet,
  timelineUsesCssRule,
} from "@/lib/gsap-css-rule";
import {
  createDraggablesForPreview,
  killDraggables,
  timelineUsesDraggable,
  timelineUsesDraggableInertia,
} from "@/lib/gsap-draggable";
import {
  resolveMotionPathElement,
  timelineUsesMotionPath,
} from "@/lib/gsap-motion-path";
import {
  ScrollTriggerEndLine,
  ScrollTriggerTriggerEdges,
  ScrollTriggerViewportOverlay,
  useScrollTriggerVisualState,
} from "@/components/ScrollTriggerVisualEditor";
import { inferScrollEndMode } from "@/lib/scroll-trigger-config";
import {
  normalizeBoundsClass,
  resolveTimelineBackground,
} from "@/lib/timeline-stage";
import { layerCustomCssToStyle } from "@/lib/layer-style";
import {
  buildScrollTriggerVars,
  getScrollPinnedTargets,
  SCROLL_PIN_HOST_ATTR,
  usesSplitScrollPin,
} from "@/lib/gsap-scroll-pin";
import { stageCss3dStyle } from "@/lib/css3d";
import { layerStackZIndex } from "@/lib/layer-stack";
import {
  getThreeLayerRoot,
  isThreeLayerReady,
  renderAllThreeLayers,
} from "@/lib/three-layer-registry";
import {
  applyThreeInitialState,
  appendThreeTweenStepsToTimeline,
} from "@/lib/three-gsap";
import { timelineUsesModel3d } from "@/lib/three-html-export";
import { cn } from "@/lib/utils";

registerPreviewGsapPlugins();

const showScrollMarkers =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_SHOW_SCROLL_MARKERS === "true";

export function PreviewArea() {
  const timelines = useTimelineStore((s) => s.timelines);
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId);
  const {
    isPlaying,
    setPlaying,
    currentTime,
    setCurrentTime,
    updateTimeline,
    updateTarget,
  } = useTimelineStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const previewScopeRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const splitInstancesRef = useRef<SplitText[]>([]);
  const dragInstancesRef = useRef<Draggable[]>([]);

  const activeTimeline = useMemo(() => {
    const raw = timelines.find((t) => t.id === activeTimelineId);
    if (!raw) return null;
    if (raw.targets?.length) return raw;
    return normalizeTimeline(raw);
  }, [timelines, activeTimelineId]);

  const isScrollMode = activeTimeline?.playbackType === "scroll";
  const usesMotionPath = activeTimeline
    ? timelineUsesMotionPath(activeTimeline)
    : false;
  const usesCssRule = activeTimeline
    ? timelineUsesCssRule(activeTimeline)
    : false;
  const usesDraggable = activeTimeline
    ? timelineUsesDraggable(activeTimeline)
    : false;
  const cssRuleStyles = useMemo(() => {
    if (!activeTimeline || !usesCssRule) return "";
    return collectCssRuleStylesheet(activeTimeline);
  }, [activeTimeline, usesCssRule]);

  const timelineData = useMemo(() => {
    if (!activeTimeline) return null;
    return {
      id: activeTimeline.id,
      keyframes: activeTimeline.keyframes,
      targets: activeTimeline.targets,
      initialStates: activeTimeline.initialStates ?? {},
      loop: activeTimeline.loop,
      yoyo: activeTimeline.yoyo,
      playbackType: activeTimeline.playbackType,
      scrollLength: activeTimeline.scrollLength ?? 300,
      scrollTriggerStart: activeTimeline.scrollTriggerStart,
      scrollTriggerEnd: activeTimeline.scrollTriggerEnd,
    };
  }, [
    activeTimeline?.id,
    activeTimeline?.keyframes,
    activeTimeline?.targets,
    activeTimeline?.initialStates,
    activeTimeline?.loop,
    activeTimeline?.yoyo,
    activeTimeline?.playbackType,
    activeTimeline?.scrollLength,
    activeTimeline?.scrollTriggerStart,
    activeTimeline?.scrollTriggerEnd,
  ]);

  const gsapAnimationDeps = useMemo(
    () => [timelineData, isScrollMode, showScrollMarkers],
    [timelineData, isScrollMode, showScrollMarkers]
  );

  /** Callback play/scrub fuori dal corpo useGSAP: contextSafe evita setState dopo unmount. */
  const { contextSafe } = useGSAP({ scope: previewScopeRef });

  const renderLayerChip = (
    target: NonNullable<typeof activeTimeline>["targets"][number],
    showLayerLabel: boolean
  ) => {
    if (!activeTimeline) return null;
    const isActive = activeTimeline.activeTargetId === target.id;
    return (
      <div
        {...(target.type === "model3d"
          ? {}
          : { "data-preview-target": target.id })}
        className={cn(
          "relative z-[1] pointer-events-auto flex flex-col items-center gap-1 [transform-style:preserve-3d]",
          target.type === "model3d" && "overflow-visible shrink-0",
          isActive &&
            "outline outline-1 outline-primary/50 outline-offset-4 rounded-sm"
        )}
        style={
          target.type === "model3d"
            ? undefined
            : layerCustomCssToStyle(target.style)
        }
        title={`${target.name} — ${target.selector}`}
      >
        <PreviewTargetView
          target={target}
          model3dHostStyle={
            target.type === "model3d"
              ? layerCustomCssToStyle(target.style)
              : undefined
          }
          onModel3dMeshesDiscovered={(targetId, names) => {
            if (!activeTimeline) return;
            const existing = activeTimeline.targets.find((t) => t.id === targetId)
              ?.model3dMeshNames;
            if (
              existing &&
              existing.length === names.length &&
              existing.every((n, i) => n === names[i])
            ) {
              return;
            }
            updateTarget(activeTimeline.id, targetId, {
              model3dMeshNames: names,
            });
          }}
        />
        {showLayerLabel || isActive ? (
          <span className="text-xxs text-muted-foreground">{target.name}</span>
        ) : null}
      </div>
    );
  };

  const renderStageStack = (
    targets: NonNullable<typeof activeTimeline>["targets"]
  ) => {
    if (!activeTimeline) return null;
    const showLayerLabel = activeTimeline.targets.length === 1;
    return targets.map((target, index) => (
      <div
        key={target.id}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: layerStackZIndex(index) }}
      >
        {renderLayerChip(target, showLayerLabel)}
      </div>
    ));
  };

  const renderTargets = () => {
    if (!activeTimeline) return null;
    const boundsClass = normalizeBoundsClass(activeTimeline.boundsClass);
    const splitPin = usesSplitScrollPin(activeTimeline);
    const pinned = splitPin ? getScrollPinnedTargets(activeTimeline) : [];
    const stageTargets = splitPin ? pinned : activeTimeline.targets;
    const css3d = stageCss3dStyle(activeTimeline);

    return (
      <div
        className={cn(
          "relative w-full min-h-64",
          boundsClass,
          splitPin && "pin-stage-host"
        )}
        style={
          css3d
            ? {
                perspective: css3d.perspective,
                transformStyle: css3d.transformStyle,
              }
            : undefined
        }
        {...(splitPin
          ? { [SCROLL_PIN_HOST_ATTR]: "true" }
          : { "data-preview-bounds": true })}
      >
        {usesMotionPath ? (
          <MotionPathGuide timeline={activeTimeline} visibleStroke />
        ) : null}
        {renderStageStack(stageTargets)}
      </div>
    );
  };

  useGSAP(
    () => {
      if (!timelineData || !activeTimeline) return;

      const scopeEl = previewScopeRef.current;
      const resolveTarget = (targetId: string) =>
        scopeEl?.querySelector<HTMLElement>(
          `[data-preview-target="${targetId}"]`
        ) ?? null;

      let cancelled = false;
      let attempts = 0;

      const buildTimeline = () => {
        if (cancelled) return;

        const allMounted = timelineData.targets.every((t) => {
          if (t.type === "model3d") {
            return Boolean(t.model3dUrl?.trim()) && isThreeLayerReady(t.id);
          }
          const el = resolveTarget(t.id);
          if (!el) return false;
          if (
            t.type === "svg" &&
            targetHasSvgPluginKeyframes(
              t.id,
              timelineData.keyframes,
              timelineData.initialStates
            )
          ) {
            return !!resolveSvgPathElement(el, t);
          }
          return true;
        });

        if (usesMotionPath && scopeEl) {
          const motionTransforms = [
            ...timelineData.keyframes.flatMap((k) => k.transforms),
            ...Object.values(timelineData.initialStates ?? {}).flatMap(
              (list) => list ?? []
            ),
          ].filter((tr) => tr.type === "motionPath");
          const pathIds = motionTransforms
            .map((tr) => String(tr.values.path ?? "").trim())
            .filter(Boolean);
          const ready = pathIds.every((pathRef) => {
            if (pathRef.startsWith("M") || pathRef.startsWith("m")) return true;
            return !!resolveMotionPathElement(scopeEl, pathRef);
          });
          if (!ready && attempts < 24) {
            attempts += 1;
            requestAnimationFrame(buildTimeline);
            return;
          }
        }

        if (!allMounted) {
          if (attempts < 24) {
            attempts += 1;
            requestAnimationFrame(buildTimeline);
            return;
          }
          if (process.env.NODE_ENV === "development") {
            timelineData.targets.forEach((t) => {
              if (t.type !== "svg") return;
              const el = resolveTarget(t.id);
              if (!el) return;
              if (!resolveSvgPathElement(el, t)) {
                console.warn(
                  `[GSAP] Path SVG non trovato per layer "${t.name}" (selettore: ${t.svgPathSelector ?? "#draw-path"})`
                );
              }
            });
          }
        }

        timelineRef.current?.kill();
        scrollTriggerRef.current = null;
        splitInstancesRef.current.forEach((split) => split.revert());
        splitInstancesRef.current = [];
        killDraggables(dragInstancesRef.current);
        dragInstancesRef.current = [];

        const scrollTriggerVars =
          isScrollMode &&
          triggerRef.current &&
          scrollContainerRef.current
            ? buildScrollTriggerVars(activeTimeline, triggerRef.current, {
                scroller: scrollContainerRef.current,
                markers: showScrollMarkers,
              })
            : undefined;

        const tl = gsap.timeline({
          ...getTimelineGsapOptions(activeTimeline),
          ...(scrollTriggerVars ? { scrollTrigger: scrollTriggerVars } : {}),
          onUpdate: contextSafe(() => {
            renderAllThreeLayers();
            if (timelineRef.current && !isScrollMode) {
              setCurrentTime(timelineRef.current.time());
            }
          }),
          onComplete: contextSafe(() => {
            if (!isScrollMode && !timelineData.loop) {
              setPlaying(false);
              setCurrentTime(0);
            }
          }),
        });

        timelineData.targets.forEach((target) => {
          const initial = timelineData.initialStates[target.id];
          const layerKeyframes = timelineData.keyframes.filter(
            (k) => k.targetId === target.id
          );
          const steps = buildTweenSteps(layerKeyframes, initial);

          if (target.type === "model3d") {
            const root = getThreeLayerRoot(target.id);
            if (!root) return;
            applyThreeInitialState(root, initial);
            appendThreeTweenStepsToTimeline(tl, root, steps);
            return;
          }

          const el = resolveTarget(target.id);
          if (!el) return;
          const pathEl =
            target.type === "svg" ? resolveSvgPathElement(el, target) : null;

          let domTweenTarget: gsap.TweenTarget = el;
          if (
            target.type === "text" &&
            isActiveTextSplit(target.textSplit)
          ) {
            const textEl = resolvePreviewTextElement(el);
            if (textEl) {
              const split = createSplitTextForPreview(
                textEl,
                target.textSplit!
              );
              if (split) {
                splitInstancesRef.current.push(split);
                domTweenTarget = splitTweenTarget(split, target.textSplit!);
              }
            }
          }

          applyInitialStateToTarget(el, initial, pathEl, domTweenTarget);
          if (pathEl) {
            measureSvgPath(pathEl);
            primeSvgPluginState(pathEl, steps, initial);
          }

          appendTweenStepsToTimeline(tl, el, steps, pathEl, domTweenTarget);
        });

        timelineRef.current = tl;

        if (isScrollMode && tl.scrollTrigger) {
          const st = tl.scrollTrigger as ScrollTrigger;
          st.vars.onUpdate = contextSafe((self: ScrollTrigger) => {
            renderAllThreeLayers();
            setCurrentTime(self.progress * tl.duration());
          });
        }

        if (timelineUsesDraggable(activeTimeline)) {
          const pairs = timelineData.targets
            .map((target) => {
              const element = resolveTarget(target.id);
              return element ? { target, element } : null;
            })
            .filter(
              (p): p is { target: (typeof timelineData.targets)[0]; element: HTMLElement } =>
                p !== null
            );
          dragInstancesRef.current = createDraggablesForPreview(
            pairs,
            scopeEl,
            activeTimeline
          );
        }

        if (isScrollMode && tl.scrollTrigger) {
          scrollTriggerRef.current = tl.scrollTrigger as ScrollTrigger;
          ScrollTrigger.refresh();
          requestAnimationFrame(() => ScrollTrigger.refresh());
        } else if (isPlaying) {
          tl.play();
        } else {
          tl.pause(0);
        }
      };

      buildTimeline();

      return () => {
        cancelled = true;
        splitInstancesRef.current.forEach((split) => split.revert());
        splitInstancesRef.current = [];
        killDraggables(dragInstancesRef.current);
        dragInstancesRef.current = [];
      };
    },
    {
      scope: previewScopeRef,
      dependencies: gsapAnimationDeps,
      revertOnUpdate: true,
    }
  );

  useEffect(() => {
    contextSafe(() => {
      if (!timelineRef.current || isScrollMode) return;
      if (isPlaying) {
        timelineRef.current.play();
      } else {
        timelineRef.current.pause();
      }
    })();
  }, [isPlaying, isScrollMode, contextSafe]);

  useEffect(() => {
    contextSafe(() => {
      if (!timelineRef.current || isPlaying) return;
      timelineRef.current.pause();
      timelineRef.current.time(currentTime);
      renderAllThreeLayers();
    })();
  }, [currentTime, isPlaying, contextSafe]);

  const scrollEndMode = activeTimeline
    ? inferScrollEndMode(
        activeTimeline.scrollTriggerEnd,
        activeTimeline.scrollEndMode
      )
  : "relative";

  const scrollVisual = useScrollTriggerVisualState({
    scrollContainerRef,
    triggerRef,
    contentRef: scrollContentRef,
    scrollTriggerStart: activeTimeline?.scrollTriggerStart,
    scrollTriggerEnd: activeTimeline?.scrollTriggerEnd,
    scrollEndMode,
    scrollLength: activeTimeline?.scrollLength ?? 300,
    onStartChange: (start) => {
      if (!activeTimeline) return;
      updateTimeline(activeTimeline.id, { scrollTriggerStart: start });
    },
    onEndChange: (end) => {
      if (!activeTimeline) return;
      updateTimeline(activeTimeline.id, {
        scrollTriggerEnd: end,
        scrollEndMode: "absolute",
      });
    },
    onScrollLengthChange: (scrollLength) => {
      if (!activeTimeline) return;
      updateTimeline(activeTimeline.id, { scrollLength });
    },
    onClearCustomEnd: () => {
      if (!activeTimeline?.scrollTriggerEnd) return;
      updateTimeline(activeTimeline.id, { scrollTriggerEnd: undefined });
    },
  });

  if (!activeTimeline) {
    return null;
  }

  const pageBackground = resolveTimelineBackground(activeTimeline);

  return (
  <>
      <GoogleFontsLoader targets={activeTimeline.targets} />
      {cssRuleStyles ? (
        <style id="preview-css-rules">{cssRuleStyles}</style>
      ) : null}
    <div
      className="relative z-0 h-full w-full min-w-0 min-h-0 px-4 flex flex-col flex-1"
      ref={previewScopeRef}
      style={pageBackground ? { background: pageBackground } : undefined}
    >
      <div className="flex flex-1 flex-col min-h-0 h-full pt-2">
        {!isScrollMode ? (
          <div className="flex flex-wrap items-center gap-3 px-1 pb-2 shrink-0">
            {usesDraggable ? (
              <span className="text-xxs text-muted-foreground border border-border rounded px-2 py-0.5">
                Trascina i layer abilitati
                {timelineUsesDraggableInertia(activeTimeline!)
                  ? " (inertia)"
                  : ""}
              </span>
            ) : null}
            <div className="flex items-center gap-2">
              <Switch
                id="loop-toggle"
                checked={activeTimeline.loop}
                onCheckedChange={(checked) =>
                  updateTimeline(activeTimeline.id, { loop: checked })
                }
                className="scale-75"
              />
              <Label htmlFor="loop-toggle" className="text-xxs cursor-pointer">
                Loop
              </Label>
            </div>
            {activeTimeline.loop ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="yoyo-toggle"
                  checked={activeTimeline.yoyo}
                  onCheckedChange={(checked) =>
                    updateTimeline(activeTimeline.id, { yoyo: checked })
                  }
                  className="scale-75"
                />
                <Label htmlFor="yoyo-toggle" className="text-xxs cursor-pointer">
                  Yo-yo
                </Label>
              </div>
            ) : null}
          </div>
        ) : null}

        {isScrollMode ? (
          <div
            ref={scrollContainerRef}
            className="relative flex-1 min-h-0 h-full overflow-y-auto scrollbar-none rounded-lg border border-border w-full"
            style={pageBackground ? { background: pageBackground } : undefined}
          >
            <ScrollTriggerViewportOverlay
              startViewportPercent={scrollVisual.startViewportPercent}
              endViewportPercent={scrollVisual.endViewportPercent}
              scrollEndMode={scrollEndMode}
              scrollerHeight={scrollVisual.scrollerHeight}
              onStartDrag={() => scrollVisual.setDragging("startViewport")}
              onEndViewportDrag={() => scrollVisual.setDragging("endViewport")}
            />
            <div
              ref={scrollContentRef}
              className="min-h-[200vh] relative"
            >
              {scrollEndMode === "relative" ? (
                <ScrollTriggerEndLine
                  endContentY={scrollVisual.endContentY}
                  scrollLength={activeTimeline.scrollLength ?? 300}
                  onDragStart={() => scrollVisual.setDragging("endContent")}
                />
              ) : null}
              <div className="h-[40vh]" />
              {usesSplitScrollPin(activeTimeline) ? (
                <div
                  className="relative mx-4 py-16 space-y-24"
                  data-preview-scroll-flow
                >
                  {activeTimeline.targets
                    .filter((t) => !t.scrollPin)
                    .map((target) => (
                      <div
                        key={target.id}
                        className="relative min-h-48 flex items-center justify-center"
                      >
                        {renderLayerChip(
                          target,
                          activeTimeline.targets.length === 1
                        )}
                      </div>
                    ))}
                </div>
              ) : null}
              <div
                ref={triggerRef}
                className="preview-trigger relative bg-transparent rounded-lg mx-4 p-8 min-h-64 flex items-center justify-center"
              >
                <ScrollTriggerTriggerEdges
                  variant="start"
                  triggerEdge={scrollVisual.startTriggerEdge}
                  onSelect={scrollVisual.selectStartTriggerEdge}
                />
                {scrollEndMode === "absolute" ? (
                  <ScrollTriggerTriggerEdges
                    variant="end"
                    triggerEdge={scrollVisual.endTriggerEdge}
                    onSelect={scrollVisual.selectEndTriggerEdge}
                  />
                ) : null}
                {renderTargets()}
              </div>
              <div className="h-[80vh]" />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-lg border border-border/40 p-8 flex-1 min-h-0 h-full w-full flex items-center justify-center relative",
              activeTimeline && timelineUsesModel3d(activeTimeline)
                ? "overflow-visible"
                : "overflow-hidden"
            )}
            style={pageBackground ? { background: pageBackground } : undefined}
          >
            {renderTargets()}
          </div>
        )}
      </div>
    </div>
  </>
  );
}