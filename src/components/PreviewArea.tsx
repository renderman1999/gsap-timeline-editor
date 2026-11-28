"use client";

import {
  forwardRef,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from "react";
import { normalizeTimeline } from "@/lib/timeline-migrate";
import { gsap } from "gsap";
import type { Draggable } from "gsap/Draggable";
import type { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { registerKeyframeEases } from "@/lib/gsap-ease";
import { addLabelsToTimeline } from "@/lib/gsap-labels";
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
import { inferScrollEndMode, resolveScrollEnd } from "@/lib/scroll-trigger-config";
import {
  normalizeBoundsClass,
  resolveTimelineBackground,
} from "@/lib/timeline-stage";
import { resolveInitialStatesForPreview } from "@/lib/initial-state-preview";
import { targetsAnimationDigest } from "@/lib/preview-gsap-deps";
import {
  applyLayerStyleLivePreviewToTargets,
  layerCustomCssToStyle,
  layerStyleToInlineString,
  layerTextUsesFullViewportWidth,
  resolveTargetStyleForPreview,
} from "@/lib/layer-style";
import {
  buildScrollTriggerVars,
  killAllPreviewScrollTriggers,
  SCROLL_PIN_HOST_ATTR,
  usesSplitScrollPin,
} from "@/lib/gsap-scroll-pin";
import {
  buildPinnedSectionScrollTriggerVars,
  buildScrollTriggerVarsForTarget,
  layerHasOwnScrollTimeline,
  partitionScrollPlayback,
  resolveLayerScrollTriggerElement,
  resolvePinnedMasterScrollTrigger,
  shouldSyncScrollPlayhead,
} from "@/lib/scroll-trigger-per-layer";
import {
  layerBelongsToFullpageStage,
  timelineUsesScrollPinLayout,
} from "@/lib/fullpage-scroll";
import { initialStatesForAnimation } from "@/lib/timeline-editor-mode";
import {
  looseSectionTargets,
  pinnedResolvedSections,
  resolveTimelineSections,
  sectionIsPinned,
  sectionMemberIds,
  sectionScrubLayers,
  targetsOutsideSectionScrub,
} from "@/lib/timeline-sections";
import { stageCss3dStyle, timelineUsesCss3d } from "@/lib/css3d";
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
import {
  getPixiLayoutEpoch,
  isPixiLayerReady,
  renderAllPixiLayers,
  subscribePixiLayoutEpoch,
} from "@/lib/pixi-layer-registry";
import {
  applyPixiInitialState,
  appendPixiTweenStepsToTimeline,
} from "@/lib/pixi-gsap";
import { timelineUsesPixi } from "@/lib/pixi-html-export";
import {
  killPixiLayerGsapTweens,
} from "@/lib/pixi-layer-registry";
import {
  killPreviewTimelineNow,
  registerPreviewTimelineKiller,
} from "@/lib/pixi-preview-sync";
import { cn } from "@/lib/utils";

registerPreviewGsapPlugins();

const showScrollMarkers =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_SHOW_SCROLL_MARKERS === "true";

const ScrollPreviewScrollBody = forwardRef<
  HTMLDivElement,
  { children: ReactNode }
>(function ScrollPreviewScrollBody({ children }, ref) {
  return (
    <div ref={ref} className="min-h-[200vh] relative">
      {children}
    </div>
  );
});

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
  const layerStyleLivePreview = useTimelineStore(
    (s) => s.layerStyleLivePreview
  );
  const initialStateLivePreview = useTimelineStore(
    (s) => s.initialStateLivePreview
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const previewScopeRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const layerTimelinesRef = useRef<Map<string, gsap.core.Timeline>>(new Map());
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  /** Evita che il playhead dell’editor sovrascriva lo scrub di ScrollTrigger sullo scroll. */
  const scrollDrivenPlayheadRef = useRef(false);
  /** Mantiene lo scroll durante il rebuild GSAP con anteprima initial state attiva. */
  const scrollTopPreserveRef = useRef<number | null>(null);
  /** Ultimo scrollTop noto (scroll classico): ripristino dopo kill ScrollTrigger. */
  const scrollStabilityRef = useRef<number | null>(null);
  const scrollPinRevertKeyRef = useRef<string | null>(null);
  const [pinHealEpoch, setPinHealEpoch] = useState(0);
  const pinHealAttemptsRef = useRef(0);
  const initialStateLivePreviewRef = useRef(initialStateLivePreview);
  initialStateLivePreviewRef.current = initialStateLivePreview;
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
  const previewInitialStates = useMemo(() => {
    if (!activeTimeline) return {};
    return resolveInitialStatesForPreview(
      activeTimeline.id,
      activeTimeline.initialStates ?? {},
      initialStateLivePreview
    );
  }, [activeTimeline, initialStateLivePreview]);

  const animationInitialStates = useMemo(() => {
    if (!activeTimeline) return {};
    return initialStatesForAnimation(activeTimeline, previewInitialStates);
  }, [activeTimeline, previewInitialStates]);

  const cssRuleStyles = useMemo(() => {
    if (!activeTimeline || !usesCssRule) return "";
    return collectCssRuleStylesheet({
      ...activeTimeline,
      initialStates: previewInitialStates,
    });
  }, [activeTimeline, usesCssRule, previewInitialStates]);

  const previewTargetsWithLiveStyle = useMemo(() => {
    if (!activeTimeline) return [];
    return applyLayerStyleLivePreviewToTargets(
      activeTimeline.id,
      activeTimeline.targets,
      layerStyleLivePreview
    );
  }, [activeTimeline, layerStyleLivePreview]);

  const storedAnimationInitialStates = useMemo(() => {
    if (!activeTimeline) return {};
    return initialStatesForAnimation(
      activeTimeline,
      activeTimeline.initialStates ?? {}
    );
  }, [activeTimeline]);

  const initialStatesStoreDigest = useMemo(() => {
    if (!activeTimeline) return "";
    return JSON.stringify(activeTimeline.initialStates ?? {});
  }, [activeTimeline?.initialStates]);

  const liveInitialPreviewDigest = useMemo(() => {
    if (!initialStateLivePreview) return "";
    return `${initialStateLivePreview.targetId}:${JSON.stringify(initialStateLivePreview.transforms)}`;
  }, [initialStateLivePreview]);

  const timelineData = useMemo(() => {
    if (!activeTimeline) return null;
    return {
      id: activeTimeline.id,
      keyframes: activeTimeline.keyframes,
      targets: activeTimeline.targets,
      initialStates: storedAnimationInitialStates,
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
    storedAnimationInitialStates,
    initialStatesStoreDigest,
    activeTimeline?.loop,
    activeTimeline?.yoyo,
    activeTimeline?.playbackType,
    activeTimeline?.scrollLength,
    activeTimeline?.scrollTriggerStart,
    activeTimeline?.scrollTriggerEnd,
  ]);

  const scrollLayoutKey = activeTimeline ? activeTimeline.id : "none";

  const pixiSettingsDigest = useMemo(() => {
    if (!activeTimeline) return "";
    return activeTimeline.targets
      .filter((t) => t.type === "pixi")
      .map((t) => JSON.stringify(t.pixiSettings ?? null))
      .join("|");
  }, [activeTimeline?.targets]);

  const pixiLayoutEpoch = useSyncExternalStore(
    subscribePixiLayoutEpoch,
    getPixiLayoutEpoch,
    getPixiLayoutEpoch
  );

  const scrollTriggerLayerDigest = useMemo(() => {
    if (!activeTimeline) return "";
    return activeTimeline.targets
      .map(
        (t) =>
          `${t.id}:${t.scrollTriggerOwn ? 1 : 0}:${t.timePlayback ? 1 : 0}:${t.scrollTriggerStart ?? ""}:${t.scrollTriggerEnd ?? ""}:${t.scrollTriggerScrollLength ?? ""}:${t.scrollTriggerSelector ?? ""}`
      )
      .join("|");
  }, [activeTimeline?.targets]);

  const gsapTargetsAnimationDigest = useMemo(() => {
    if (!activeTimeline) return "";
    return targetsAnimationDigest(activeTimeline.targets);
  }, [activeTimeline?.targets]);

  const timelineDataRef = useRef(timelineData);
  const activeTimelineRef = useRef(activeTimeline);
  timelineDataRef.current = timelineData;
  activeTimelineRef.current = activeTimeline;

  const initialPreviewCaptureKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!isScrollMode) return;

    if (!initialStateLivePreview) {
      const hadLive = initialPreviewCaptureKeyRef.current !== null;
      const scroller = scrollContainerRef.current;
      const preserved = scrollTopPreserveRef.current;
      if (hadLive && scroller && preserved !== null) {
        scroller.scrollTop = preserved;
        scrollStabilityRef.current = preserved;
        ScrollTrigger.update();
      }
      initialPreviewCaptureKeyRef.current = null;
      scrollTopPreserveRef.current = null;
      return;
    }
    const captureKey = `${initialStateLivePreview.timelineId}:${initialStateLivePreview.targetId}`;
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    if (initialPreviewCaptureKeyRef.current !== captureKey) {
      initialPreviewCaptureKeyRef.current = captureKey;
      scrollTopPreserveRef.current = scroller.scrollTop;
    }
  }, [initialStateLivePreview, isScrollMode]);

  useEffect(() => {
    if (!isScrollMode) return;
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      scrollStabilityRef.current = scroller.scrollTop;
      if (initialStateLivePreviewRef.current) {
        scrollTopPreserveRef.current = scroller.scrollTop;
      }
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const onStRefresh = () => {
      const target = initialStateLivePreviewRef.current
        ? scrollTopPreserveRef.current
        : scrollStabilityRef.current;
      if (target === null) return;
      if (Math.abs(scroller.scrollTop - target) > 2) {
        scroller.scrollTop = target;
      }
    };
    ScrollTrigger.addEventListener("refresh", onStRefresh);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ScrollTrigger.removeEventListener("refresh", onStRefresh);
    };
  }, [
    isScrollMode,
    initialStateLivePreview?.timelineId,
    initialStateLivePreview?.targetId,
  ]);

  const restoreScrollAfterStKill = () => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const target = initialStateLivePreviewRef.current
      ? scrollTopPreserveRef.current
      : scrollStabilityRef.current;
    if (target === null) return;
    if (Math.abs(scroller.scrollTop - target) > 2) {
      scroller.scrollTop = target;
    }
  };

  const sectionDigest = useMemo(() => {
    if (!activeTimeline?.sections?.length) return "";
    return activeTimeline.sections
      .map(
        (section) =>
          `${section.id}:${section.scrollPin === false ? 0 : 1}:${section.layerIds.join(",")}`
      )
      .join("|");
  }, [activeTimeline?.sections]);

  const gsapAnimationDeps = useMemo(
    () => [
      activeTimeline?.id,
      activeTimeline?.keyframes,
      activeTimeline?.labels,
      initialStatesStoreDigest,
      activeTimeline?.loop,
      activeTimeline?.yoyo,
      activeTimeline?.playbackType,
      activeTimeline?.scrollLength,
      activeTimeline?.scrollTriggerStart,
      activeTimeline?.scrollTriggerEnd,
      gsapTargetsAnimationDigest,
      isScrollMode,
      showScrollMarkers,
      scrollLayoutKey,
      pixiSettingsDigest,
      pixiLayoutEpoch,
      scrollTriggerLayerDigest,
      sectionDigest,
      pinHealEpoch,
    ],
    [
      activeTimeline?.id,
      activeTimeline?.keyframes,
      activeTimeline?.labels,
      initialStatesStoreDigest,
      activeTimeline?.loop,
      activeTimeline?.yoyo,
      activeTimeline?.playbackType,
      activeTimeline?.scrollLength,
      activeTimeline?.scrollTriggerStart,
      activeTimeline?.scrollTriggerEnd,
      gsapTargetsAnimationDigest,
      isScrollMode,
      showScrollMarkers,
      scrollLayoutKey,
      pixiSettingsDigest,
      pixiLayoutEpoch,
      scrollTriggerLayerDigest,
      sectionDigest,
      pinHealEpoch,
    ]
  );

  useLayoutEffect(() => {
    registerPreviewTimelineKiller(() => {
      layerTimelinesRef.current.forEach((layerTl) => {
        layerTl.scrollTrigger?.kill(true);
        layerTl.kill();
      });
      layerTimelinesRef.current.clear();
      masterTimelineRef.current?.scrollTrigger?.kill(true);
      masterTimelineRef.current?.kill();
      masterTimelineRef.current = null;
      timelineRef.current?.scrollTrigger?.kill(true);
      timelineRef.current?.kill();
      timelineRef.current = null;
      scrollTriggerRef.current = null;
    });
    return () => registerPreviewTimelineKiller(null);
  }, []);

  /** Callback play/scrub fuori dal corpo useGSAP: contextSafe evita setState dopo unmount. */
  const { contextSafe } = useGSAP({ scope: previewScopeRef });

  useEffect(() => {
    if (!initialStateLivePreview || !activeTimeline) return;

    contextSafe(() => {
      const scopeEl = previewScopeRef.current;
      const targetId = initialStateLivePreview.targetId;
      const target = activeTimeline.targets.find((t) => t.id === targetId);
      if (!target || !scopeEl) return;

      const esc =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(targetId)
          : targetId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const initial = initialStateLivePreview.transforms;

      if (target.type === "pixi") {
        applyPixiInitialState(target.id, initial);
        renderAllPixiLayers();
      } else if (target.type === "model3d") {
        const root = getThreeLayerRoot(target.id);
        if (root) {
          applyThreeInitialState(root, initial);
          renderAllThreeLayers();
        }
      } else {
        const el = scopeEl.querySelector<HTMLElement>(
          `[data-preview-target="${esc}"]`
        );
        if (!el) return;
        const pathEl =
          target.type === "svg" ? resolveSvgPathElement(el, target) : null;
        let domTweenTarget: gsap.TweenTarget = el;
        if (target.type === "text" && isActiveTextSplit(target.textSplit)) {
          const textEl = resolvePreviewTextElement(el);
          const existingSplit = splitInstancesRef.current.find((split) => {
            const splitEl = split.elements?.[0] as Element | undefined;
            return splitEl && textEl?.contains(splitEl);
          });
          if (existingSplit) {
            domTweenTarget = splitTweenTarget(existingSplit, target.textSplit!);
          }
        }
        applyInitialStateToTarget(el, initial, pathEl, domTweenTarget);
        if (pathEl) measureSvgPath(pathEl);
      }

    })();
  }, [
    liveInitialPreviewDigest,
    activeTimeline,
    contextSafe,
    initialStateLivePreview,
  ]);

  const renderLayerChip = (
    target: NonNullable<typeof activeTimeline>["targets"][number],
    showLayerLabel: boolean
  ) => {
    if (!activeTimeline) return null;
    const isActive = activeTimeline.activeTargetId === target.id;
    const previewStyle = resolveTargetStyleForPreview(
      activeTimeline.id,
      target,
      layerStyleLivePreview
    );
    const targetForView = { ...target, style: previewStyle };
    const textFullSection =
      target.type === "text" &&
      layerTextUsesFullViewportWidth(previewStyle);
    const pixiFillsSection = false;
    return (
      <div
        className={cn(
          "relative z-[1] pointer-events-auto flex flex-col",
          textFullSection ? "w-full max-w-full items-stretch" : "items-center",
          (target.type === "model3d" || target.type === "pixi") &&
            "overflow-visible shrink-0",
          target.type === "code" && "w-full max-w-full",
          pixiFillsSection && "absolute inset-0 w-full h-full max-w-none",
          isActive &&
            "outline outline-1 outline-primary/50 outline-offset-4 rounded-sm"
        )}
        title={`${target.name} — ${target.selector}`}
      >
        <div
          className={cn(
            (textFullSection ||
              target.type === "code" ||
              target.type === "pixi") &&
              "w-full max-w-full",
            "[&_.layer-custom-css-host]:[transform-style:preserve-3d]"
          )}
          style={layerCustomCssToStyle(previewStyle)}
        >
          <div
            {...(target.type === "model3d" ||
            target.type === "pixi" ||
            target.type === "text"
              ? {}
              : { "data-preview-target": target.id })}
            className={cn(
              "layer-custom-css-host [transform-style:preserve-3d]",
              target.type === "text"
                ? textFullSection
                  ? "block w-full max-w-full"
                  : "flex items-center justify-center"
                : target.type === "pixi"
                  ? "flex w-full max-w-full overflow-visible"
                  : textFullSection
                    ? "flex w-full max-w-full justify-center"
                    : "flex items-center justify-center"
            )}
          >
            <PreviewTargetView
              key={`${target.id}-${target.shape ?? "square"}-${target.type}-${target.codeHtml?.length ?? 0}-${previewStyle?.textFullViewportWidth ? "fw" : "nw"}-${layerStyleToInlineString(previewStyle)}`}
              target={targetForView}
              previewTargetId={target.type === "text" ? target.id : undefined}
              textFullWidthContext="viewport"
              pixiSectionFill={false}
            onModel3dMeshesDiscovered={(targetId, names) => {
              if (!activeTimeline) return;
              const existing = activeTimeline.targets.find(
                (t) => t.id === targetId
              )?.model3dMeshNames;
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
          </div>
        </div>
        {showLayerLabel || isActive ? (
          <span className="pointer-events-none absolute left-1/2 top-full z-[1] mt-1 -translate-x-1/2 whitespace-nowrap text-xxs text-muted-foreground">
            {target.name}
          </span>
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

  const flowScrollTargets = useMemo(() => {
    if (!activeTimeline || !isScrollMode || !usesSplitScrollPin(activeTimeline)) {
      return [];
    }
    const members = sectionMemberIds(activeTimeline);
    return activeTimeline.targets.filter(
      (t) =>
        !members.has(t.id) && (t.timePlayback === true || !t.scrollPin)
    );
  }, [activeTimeline, isScrollMode]);

  const renderFlowScrollLayers = (
    triggerSlotRef?: Ref<HTMLDivElement>
  ) => {
    if (!activeTimeline) return null;
    const showLayerLabel = activeTimeline.targets.length === 1;
    const looseSections = resolveTimelineSections(activeTimeline).filter(
      (section) => !sectionIsPinned(section)
    );
    const hasFlow = flowScrollTargets.length > 0 || looseSections.length > 0;
    return (
      <div
        ref={triggerSlotRef}
        className={cn(
          "scroll-flow-layers px-4 flex flex-col items-stretch gap-24 w-full",
          hasFlow ? "py-16" : "py-0 min-h-0"
        )}
        data-scroll-flow-host
        aria-hidden={!hasFlow}
      >
        {flowScrollTargets.map((target) => (
          <div
            key={target.id}
            className="flow-layer-slot relative min-h-48 w-full flex items-center justify-center pointer-events-none"
          >
            {renderLayerChip(target, showLayerLabel)}
          </div>
        ))}
        {looseSections.map((section) => renderSectionBlock(section, false))}
      </div>
    );
  };

  const renderSectionBlock = (
    section: ReturnType<typeof resolveTimelineSections>[number],
    pinned: boolean
  ) => (
    <div
      key={section.id}
      className={
        pinned
          ? "pin-layer-section relative flex w-full shrink-0 items-center justify-center"
          : "scroll-section relative flex min-h-48 w-full items-center justify-center"
      }
      style={pinned ? { height: "100cqh" } : undefined}
      data-pin-section={pinned ? section.id : undefined}
      data-scroll-section={section.id}
    >
      <div className="pointer-events-none flex flex-col items-center justify-center gap-8">
        {section.layers.map((layer) => (
          <div key={layer.id}>{renderLayerChip(layer, false)}</div>
        ))}
      </div>
    </div>
  );

  const renderPinSections = (triggerSlotRef?: Ref<HTMLDivElement>) => {
    if (!activeTimeline || !usesSplitScrollPin(activeTimeline)) return null;
    const members = sectionMemberIds(activeTimeline);
    const pinned = activeTimeline.targets.filter(
      (target) =>
        target.scrollPin &&
        target.timePlayback !== true &&
        !members.has(target.id)
    );
    const pinnedSections = pinnedResolvedSections(activeTimeline);
    return (
      <>
        {pinnedSections.map((section) => renderSectionBlock(section, true))}
        {pinned.map((target) => (
      <div
        key={target.id}
        ref={
          triggerSlotRef && activeTimeline.activeTargetId === target.id
            ? triggerSlotRef
            : undefined
        }
        className="pin-layer-section relative flex w-full shrink-0 items-center justify-center"
        style={{ height: "100cqh" }}
        data-pin-section={target.id}
      >
        {renderLayerChip(target, true)}
      </div>
        ))}
      </>
    );
  };

  const renderTargets = () => {
    if (!activeTimeline) return null;
    const boundsClass = normalizeBoundsClass(activeTimeline.boundsClass);
    const scrollPinLayout = timelineUsesScrollPinLayout(activeTimeline);
    const stageTargets = activeTimeline.targets.filter((t) =>
      layerBelongsToFullpageStage(activeTimeline, t)
    );
    const css3d = stageCss3dStyle(activeTimeline);

    return (
      <div
        className={cn(
          "relative w-full min-h-64",
          boundsClass,
          scrollPinLayout && "pin-stage-host"
        )}
        style={
          css3d
            ? {
                perspective: css3d.perspective,
                transformStyle: css3d.transformStyle,
              }
            : undefined
        }
        {...(scrollPinLayout
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
      const timelineData = timelineDataRef.current;
      const activeTimeline = activeTimelineRef.current;
      if (!timelineData || !activeTimeline) return;

      const scrollerOnEnter = scrollContainerRef.current;
      if (isScrollMode && initialStateLivePreviewRef.current && scrollerOnEnter) {
        if (scrollTopPreserveRef.current === null) {
          scrollTopPreserveRef.current = scrollerOnEnter.scrollTop;
        }
      }

      const scopeEl = previewScopeRef.current;
      const resolveTarget = (targetId: string) => {
        const esc =
          typeof CSS !== "undefined" && typeof CSS.escape === "function"
            ? CSS.escape(targetId)
            : targetId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return (
          scopeEl?.querySelector<HTMLElement>(
            `[data-preview-target="${esc}"]`
          ) ?? null
        );
      };

      let cancelled = false;
      let attempts = 0;

      const buildTimeline = () => {
        if (cancelled) return;

        const allMounted = timelineData.targets.every((t) => {
          if (t.type === "model3d") {
            return Boolean(t.model3dUrl?.trim()) && isThreeLayerReady(t.id);
          }
          if (t.type === "pixi") {
            return isPixiLayerReady(t.id);
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

        layerTimelinesRef.current.forEach((layerTl) => {
          layerTl.scrollTrigger?.kill(true);
          layerTl.kill();
        });
        layerTimelinesRef.current.clear();
        masterTimelineRef.current?.scrollTrigger?.kill(true);
        masterTimelineRef.current?.kill();
        masterTimelineRef.current = null;
        timelineRef.current?.scrollTrigger?.kill(true);
        timelineRef.current?.kill();
        timelineRef.current = null;
        scrollTriggerRef.current = null;
        splitInstancesRef.current.forEach((split) => split.revert());
        splitInstancesRef.current = [];
        killDraggables(dragInstancesRef.current);
        dragInstancesRef.current = [];
        registerKeyframeEases(timelineData.keyframes);

        const grouped = partitionScrollPlayback(
          isScrollMode
            ? targetsOutsideSectionScrub(activeTimeline)
            : timelineData.targets
        );
        const timed = isScrollMode ? grouped.timed : [];
        const pinned = isScrollMode ? grouped.pinned : [];
        const own = isScrollMode ? grouped.own : [];
        const sectionPins = isScrollMode
          ? pinnedResolvedSections(activeTimeline)
          : [];
        const shared = isScrollMode
          ? [...grouped.shared, ...looseSectionTargets(activeTimeline)]
          : timelineData.targets;
        const scrollScroller = scrollContainerRef.current;
        const scrollMarkers = showScrollMarkers;
        const flowHost = scopeEl?.querySelector<HTMLElement>(
          "[data-scroll-flow-host]"
        );
        const masterTriggerEl =
          pinned.length > 0 || sectionPins.length > 0
            ? flowHost ?? null
            : triggerRef.current;

        const needsMasterScroll = Boolean(
          isScrollMode &&
            masterTriggerEl &&
            scrollScroller &&
            shared.length > 0
        );

        const masterScrollTrigger =
          needsMasterScroll && masterTriggerEl
            ? pinned.length > 0
              ? {
                  trigger: masterTriggerEl,
                  start: activeTimeline.scrollTriggerStart?.trim() || "top center",
                  end: resolveScrollEnd(
                    activeTimeline.scrollLength,
                    activeTimeline.scrollTriggerEnd
                  ),
                }
              : resolvePinnedMasterScrollTrigger(
                  activeTimeline,
                  masterTriggerEl,
                  resolveTarget,
                  scopeEl
                )
            : null;
        const scrollTriggerVars =
          needsMasterScroll && masterScrollTrigger
            ? buildScrollTriggerVars(
                activeTimeline,
                masterScrollTrigger.trigger,
                {
                  ...(scrollScroller ? { scroller: scrollScroller } : {}),
                  markers: scrollMarkers,
                  start: masterScrollTrigger.start,
                  end: masterScrollTrigger.end,
                  refreshPriority: pinned.length + 1,
                }
              )
            : undefined;

        const attachScrollTimeSync = (
          syncTl: gsap.core.Timeline,
          ownerTargetId: string | null
        ) => {
          if (!isScrollMode || !syncTl.scrollTrigger) return;
          const st = syncTl.scrollTrigger as ScrollTrigger;
          st.vars.onUpdate = contextSafe((self: ScrollTrigger) => {
            renderAllThreeLayers();
            renderAllPixiLayers();
            if (
              shouldSyncScrollPlayhead(
                activeTimeline.activeTargetId,
                timelineData.targets,
                ownerTargetId
              )
            ) {
              scrollDrivenPlayheadRef.current = true;
              setCurrentTime(self.progress * syncTl.duration());
            }
          });
        };

        const appendTargetToTimeline = (
          destTl: gsap.core.Timeline,
          target: (typeof timelineData.targets)[0]
        ) => {
          const initial = timelineData.initialStates[target.id];
          const layerKeyframes = timelineData.keyframes.filter(
            (k) =>
              (k.targetId ?? activeTimeline.activeTargetId) === target.id
          );
          const steps = buildTweenSteps(layerKeyframes, initial);

          if (target.type === "model3d") {
            const root = getThreeLayerRoot(target.id);
            if (!root) return;
            applyThreeInitialState(root, initial);
            appendThreeTweenStepsToTimeline(destTl, root, steps);
            return;
          }

          if (target.type === "pixi") {
            if (!isPixiLayerReady(target.id)) return;
            applyPixiInitialState(target.id, initial);
            appendPixiTweenStepsToTimeline(destTl, target.id, steps);
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

          appendTweenStepsToTimeline(destTl, el, steps, pathEl, domTweenTarget);
        };

        timed.forEach((target) => {
          const layerTl = gsap.timeline({
            paused: false,
            repeat: activeTimeline.loop ? -1 : 0,
            yoyo: Boolean(activeTimeline.loop && activeTimeline.yoyo),
            onUpdate: contextSafe(() => {
              renderAllThreeLayers();
              renderAllPixiLayers();
            }),
          });
          addLabelsToTimeline(layerTl, activeTimeline.labels);
          appendTargetToTimeline(layerTl, target);
          layerTimelinesRef.current.set(target.id, layerTl);
        });

        if (triggerRef.current && scrollScroller) {
          own.forEach((target) => {
            const layerEl = resolveTarget(target.id);
            const stageTrigger = triggerRef.current!;
            const triggerEl = resolveLayerScrollTriggerElement(
              scopeEl,
              target,
              layerEl,
              stageTrigger
            );
            const layerScrollVars = buildScrollTriggerVarsForTarget(
              activeTimeline,
              target,
              triggerEl,
              {
                scroller: scrollScroller,
                markers: scrollMarkers,
                refreshPriority: pinned.length + 1,
              }
            );
            const layerTl = gsap.timeline({
              ...getTimelineGsapOptions(activeTimeline),
              scrollTrigger: layerScrollVars,
            });
            addLabelsToTimeline(layerTl, activeTimeline.labels);
            appendTargetToTimeline(layerTl, target);
            attachScrollTimeSync(layerTl, target.id);
            layerTimelinesRef.current.set(target.id, layerTl);
          });
        }

        if (isScrollMode && scrollScroller && scopeEl) {
          const pinCount = sectionPins.length + pinned.length;
          sectionPins.forEach((section, index) => {
            const esc =
              typeof CSS !== "undefined" && typeof CSS.escape === "function"
                ? CSS.escape(section.id)
                : section.id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
            const sectionEl = scopeEl.querySelector<HTMLElement>(
              `[data-pin-section="${esc}"]`
            );
            if (!sectionEl) return;
            const sectionTl = gsap.timeline({
              ...getTimelineGsapOptions(activeTimeline),
              scrollTrigger: buildPinnedSectionScrollTriggerVars(
                activeTimeline,
                { id: section.id } as (typeof timelineData.targets)[number],
                sectionEl,
                {
                  scroller: scrollScroller,
                  markers: scrollMarkers,
                  refreshPriority: pinCount - index,
                }
              ),
            });
            addLabelsToTimeline(sectionTl, activeTimeline.labels);
            sectionScrubLayers(section).forEach((layer) => {
              appendTargetToTimeline(sectionTl, layer);
              layerTimelinesRef.current.set(layer.id, sectionTl);
            });
            attachScrollTimeSync(sectionTl, section.layers[0]?.id ?? null);
          });
          pinned.forEach((target, index) => {
            const esc =
              typeof CSS !== "undefined" && typeof CSS.escape === "function"
                ? CSS.escape(target.id)
                : target.id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
            const section = scopeEl.querySelector<HTMLElement>(
              `[data-pin-section="${esc}"]`
            );
            if (!section) return;
            const layerTl = gsap.timeline({
              ...getTimelineGsapOptions(activeTimeline),
              scrollTrigger: buildPinnedSectionScrollTriggerVars(
                activeTimeline,
                target,
                section,
                {
                  scroller: scrollScroller,
                  markers: scrollMarkers,
                  refreshPriority: pinCount - (sectionPins.length + index),
                }
              ),
            });
            addLabelsToTimeline(layerTl, activeTimeline.labels);
            appendTargetToTimeline(layerTl, target);
            attachScrollTimeSync(layerTl, target.id);
            layerTimelinesRef.current.set(target.id, layerTl);
          });
        }

        const tl = gsap.timeline({
          ...getTimelineGsapOptions(activeTimeline),
          ...(scrollTriggerVars ? { scrollTrigger: scrollTriggerVars } : {}),
          onUpdate: contextSafe(() => {
            renderAllThreeLayers();
            renderAllPixiLayers();
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
        addLabelsToTimeline(tl, activeTimeline.labels);

        shared.forEach((target) => appendTargetToTimeline(tl, target));
        attachScrollTimeSync(tl, null);

        masterTimelineRef.current = tl;
        const activeTarget = timelineData.targets.find(
          (t) => t.id === activeTimeline.activeTargetId
        );
        if (activeTarget && layerHasOwnScrollTimeline(activeTarget)) {
          timelineRef.current =
            layerTimelinesRef.current.get(activeTarget.id) ?? tl;
        } else {
          timelineRef.current = tl;
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

        if (isScrollMode) {
          const primarySt = timelineRef.current?.scrollTrigger as
            | ScrollTrigger
            | undefined;
          scrollTriggerRef.current = primarySt ?? null;
          ScrollTrigger.refresh();
          restoreScrollAfterStKill();
          ScrollTrigger.update();
        } else if (isPlaying) {
          tl.play();
        } else {
          tl.pause(0);
          layerTimelinesRef.current.forEach((layerTl) => layerTl.pause(0));
        }
      };

      buildTimeline();

      return () => {
        cancelled = true;
        const pinRevert = !initialStateLivePreviewRef.current;
        activeTimeline.targets
          .filter((t) => t.type === "pixi")
          .forEach((t) => killPixiLayerGsapTweens(t.id));
        killPreviewTimelineNow();
        layerTimelinesRef.current.forEach((layerTl) => {
          layerTl.scrollTrigger?.kill(pinRevert);
          layerTl.kill();
        });
        layerTimelinesRef.current.clear();
        masterTimelineRef.current?.scrollTrigger?.kill(pinRevert);
        masterTimelineRef.current?.kill();
        masterTimelineRef.current = null;
        timelineRef.current?.scrollTrigger?.kill(pinRevert);
        timelineRef.current?.kill();
        timelineRef.current = null;
        scrollTriggerRef.current = null;
        splitInstancesRef.current.forEach((split) => split.revert());
        splitInstancesRef.current = [];
        killDraggables(dragInstancesRef.current);
        dragInstancesRef.current = [];
        killAllPreviewScrollTriggers(pinRevert);
        restoreScrollAfterStKill();
      };
    },
    {
      scope: previewScopeRef,
      dependencies: gsapAnimationDeps,
      revertOnUpdate: true,
    }
  );

  useLayoutEffect(() => {
    if (!isScrollMode || !activeTimeline) {
      pinHealAttemptsRef.current = 0;
      return;
    }
    const needsPin = usesSplitScrollPin(activeTimeline);
    if (!needsPin) {
      pinHealAttemptsRef.current = 0;
      return;
    }
    const scope = previewScopeRef.current;
    const sections = scope?.querySelectorAll("[data-pin-section]").length ?? 0;
    const spacers = scope?.querySelectorAll(".pin-spacer").length ?? 0;
    if (sections > 0 && spacers > 0) {
      pinHealAttemptsRef.current = 0;
      return;
    }
    if (sections > 0 && spacers === 0 && pinHealAttemptsRef.current < 2) {
      pinHealAttemptsRef.current += 1;
      setPinHealEpoch((epoch) => epoch + 1);
    }
  }, [isScrollMode, activeTimeline, gsapTargetsAnimationDigest, scrollTriggerLayerDigest, sectionDigest, pinHealEpoch]);

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
    if (!isScrollMode || !activeTimeline) return;
    const activeId = activeTimeline.activeTargetId;
    const activeTarget = activeTimeline.targets.find((t) => t.id === activeId);
    if (activeTarget && layerHasOwnScrollTimeline(activeTarget)) {
      const layerTl = layerTimelinesRef.current.get(activeId);
      if (layerTl) {
        timelineRef.current = layerTl;
        const st = layerTl.scrollTrigger as ScrollTrigger | undefined;
        scrollTriggerRef.current = st ?? null;
      }
    } else if (masterTimelineRef.current) {
      timelineRef.current = masterTimelineRef.current;
      const st = masterTimelineRef.current.scrollTrigger as
        | ScrollTrigger
        | undefined;
      scrollTriggerRef.current = st ?? null;
    }
  }, [
    activeTimeline?.activeTargetId,
    activeTimeline,
    isScrollMode,
  ]);

  useEffect(() => {
    contextSafe(() => {
      if (isPlaying) return;
      if (isScrollMode && scrollDrivenPlayheadRef.current) {
        scrollDrivenPlayheadRef.current = false;
        return;
      }
      if (initialStateLivePreview) return;

      const activeId = activeTimeline?.activeTargetId;
      const activeTarget = activeTimeline?.targets.find(
        (t) => t.id === activeId
      );
      const scrubTl =
        activeTarget && layerHasOwnScrollTimeline(activeTarget)
          ? layerTimelinesRef.current.get(activeTarget.id) ??
            masterTimelineRef.current
          : masterTimelineRef.current ?? timelineRef.current;

      if (!scrubTl) return;
      scrubTl.pause();
      scrubTl.time(currentTime);
      renderAllThreeLayers();
      renderAllPixiLayers();
    })();
  }, [
    currentTime,
    isPlaying,
    isScrollMode,
    contextSafe,
    activeTimeline,
    initialStateLivePreview,
  ]);

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

  const scrollPinRevertKey = isScrollMode
    ? `${activeTimeline?.id ?? ""}:${gsapTargetsAnimationDigest}:${scrollTriggerLayerDigest}:${sectionDigest}`
    : "";
  if (scrollPinRevertKeyRef.current !== scrollPinRevertKey) {
    const hadPinnedScroll = Boolean(scrollPinRevertKeyRef.current);
    scrollPinRevertKeyRef.current = scrollPinRevertKey;
    if (hadPinnedScroll) killAllPreviewScrollTriggers(true);
  }

  if (!activeTimeline) {
    return null;
  }

  const splitScrollPin = usesSplitScrollPin(activeTimeline);
  const activePinLayer = activeTimeline.targets.some(
    (target) => target.id === activeTimeline.activeTargetId && target.scrollPin
  );

  const pageBackground = resolveTimelineBackground(activeTimeline);

  return (
  <>
      <GoogleFontsLoader targets={previewTargetsWithLiveStyle} />
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
            id="scroller"
            data-preview-scroller=""
            className="relative flex-1 min-h-0 h-full overflow-y-auto scrollbar-none rounded-lg border border-border w-full"
            style={{
              ...(pageBackground ? { background: pageBackground } : {}),
              containerType: "size",
            }}
          >
            <ScrollTriggerViewportOverlay
              startViewportPercent={scrollVisual.startViewportPercent}
              endViewportPercent={scrollVisual.endViewportPercent}
              scrollEndMode={scrollEndMode}
              scrollerHeight={scrollVisual.scrollerHeight}
              onStartDrag={() => scrollVisual.setDragging("startViewport")}
              onEndViewportDrag={() =>
                scrollVisual.setDragging("endViewport")
              }
            />
            <ScrollPreviewScrollBody
              key={scrollLayoutKey}
              ref={scrollContentRef}
            >
              {scrollEndMode === "relative" ? (
                <ScrollTriggerEndLine
                  endContentY={scrollVisual.endContentY}
                  scrollLength={activeTimeline.scrollLength ?? 300}
                  onDragStart={() => scrollVisual.setDragging("endContent")}
                />
              ) : null}
              <div className="h-[40vh]" />
              {renderFlowScrollLayers(
                splitScrollPin && !activePinLayer ? triggerRef : undefined
              )}
              {renderPinSections(
                splitScrollPin && activePinLayer ? triggerRef : undefined
              )}
              {splitScrollPin ? null : (
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
              )}
              <div className="h-[80vh]" />
            </ScrollPreviewScrollBody>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-lg border border-border/40 p-8 flex-1 min-h-0 h-full w-full flex items-center justify-center relative",
              activeTimeline &&
              (timelineUsesModel3d(activeTimeline) ||
                timelineUsesPixi(activeTimeline))
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