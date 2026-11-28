import {
  DEFAULT_DRAGGABLE_CONFIG,
} from "@/lib/gsap-draggable";
import {
  DEFAULT_BOUNDS_CLASS,
  normalizeBoundsClass,
  sanitizeStoredDraggableBounds,
} from "@/lib/timeline-stage";
import { DEFAULT_MOTION_PATH_SELECTOR } from "@/lib/gsap-motion-path";
import { DEFAULT_LAYER_SVG } from "@/lib/svg-sanitize";
import { DEFAULT_MODEL3D_SCENE } from "@/lib/model3d-scene";
import { DEFAULT_CODE_HTML, DEFAULT_CODE_JS } from "@/lib/code-layer";
import { DEFAULT_PIXI_SCENE } from "@/lib/pixi-scene";
import { normalizeModel3dInteraction } from "@/lib/model3d-interaction";
import { normalizeTimelineLabels } from "@/lib/gsap-labels";
import { normalizeTimelineSections } from "@/lib/timeline-sections";
import { normalizeEditorMode } from "@/lib/timeline-editor-mode";
import type {
  AnimationTarget,
  AnimationTargetType,
  Timeline,
  Keyframe,
  Transform,
} from "@/stores/timeline-store";

export const DEFAULT_TARGET_ID = "default-target";

export function newTargetId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function createAnimationTarget(
  partial?: Partial<AnimationTarget>
): AnimationTarget {
  const id = partial?.id ?? newTargetId();
  const type: AnimationTargetType = partial?.type ?? "shape";
  return {
    id,
    name: partial?.name ?? "Layer 1",
    type,
    selector: partial?.selector ?? (id === DEFAULT_TARGET_ID ? ".target" : `.layer-${id.slice(0, 6)}`),
    shape: partial?.shape ?? "square",
    text: partial?.text ?? "Testo",
    textSplit:
      partial?.type === "text"
        ? (partial?.textSplit ?? "none")
        : undefined,
    imageUrl:
      partial?.type === "image"
        ? partial?.imageUrl ??
          "https://picsum.photos/seed/gsap-layer/160/160"
        : partial?.imageUrl,
    imageWidth: partial?.type === "image" ? partial?.imageWidth : undefined,
    model3dUrl: partial?.type === "model3d" ? partial?.model3dUrl : undefined,
    model3dScene:
      partial?.type === "model3d"
        ? (partial?.model3dScene ?? { ...DEFAULT_MODEL3D_SCENE, meshMaterials: {} })
        : undefined,
    model3dMeshNames:
      partial?.type === "model3d" ? partial?.model3dMeshNames : undefined,
    model3dInteractions:
      partial?.type === "model3d"
        ? normalizeModel3dInteraction(partial?.model3dInteractions)
        : undefined,
    svgContent:
      partial?.svgContent ??
      (type === "svg" ? DEFAULT_LAYER_SVG : undefined),
    svgPathSelector:
      partial?.svgPathSelector ?? (type === "svg" ? "#draw-path" : undefined),
    codeHtml:
      type === "code" ? (partial?.codeHtml ?? DEFAULT_CODE_HTML) : undefined,
    codeJs: type === "code" ? (partial?.codeJs ?? DEFAULT_CODE_JS) : undefined,
    pixiScene:
      type === "pixi" ? (partial?.pixiScene ?? DEFAULT_PIXI_SCENE) : undefined,
    pixiSettings: type === "pixi" ? partial?.pixiSettings : undefined,
    motionPathSelector:
      partial?.motionPathSelector ?? DEFAULT_MOTION_PATH_SELECTOR,
    draggable: partial?.draggable ?? { ...DEFAULT_DRAGGABLE_CONFIG },
    scrollTriggerOwn: partial?.scrollTriggerOwn,
    scrollTriggerStart: partial?.scrollTriggerStart,
    scrollTriggerEnd: partial?.scrollTriggerEnd,
    scrollTriggerScrollLength: partial?.scrollTriggerScrollLength,
    scrollTriggerSelector: partial?.scrollTriggerSelector,
    scrollPin: partial?.scrollPin,
    timePlayback: partial?.timePlayback,
    style: partial?.style,
  };
}

function normalizeTimelineScrollFields(
  timeline: Partial<Timeline> & { playbackType?: Timeline["playbackType"] }
): Pick<Timeline, "scrollLayout"> {
  const scrollLayout =
    timeline.playbackType === "scroll" ? "default" : undefined;
  return { scrollLayout };
}

function normalizeTimelineExtraFields(timeline: Partial<Timeline> & { id?: string }) {
  return { editorMode: normalizeEditorMode(timeline.editorMode, timeline) };
}

export function normalizeTimeline(timeline: Timeline | Partial<Timeline> & { id: string; name: string; keyframes: Keyframe[] }): Timeline {
  if (timeline.targets && timeline.targets.length > 0) {
    const targetIds = new Set(timeline.targets.map((t) => t.id));
    const defaultId = timeline.targets[0].id;
    const keyframes: Keyframe[] = timeline.keyframes.map((k) => ({
      ...k,
      targetId:
        k.targetId && targetIds.has(k.targetId) ? k.targetId : defaultId,
    }));
    const initialStates = { ...(timeline.initialStates ?? {}) };
    if (
      timeline.initialState?.length &&
      !initialStates[defaultId]?.length
    ) {
      initialStates[defaultId] = timeline.initialState;
    }
    const playbackType = timeline.playbackType ?? "normal";

    return {
      id: timeline.id,
      name: timeline.name,
      ...normalizeTimelineExtraFields(timeline),
      playbackType,
      scrollLength: timeline.scrollLength,
      scrollTriggerStart: timeline.scrollTriggerStart,
      scrollTriggerEnd: timeline.scrollTriggerEnd,
      scrollEndMode: timeline.scrollEndMode,
      ...normalizeTimelineScrollFields({ ...timeline, playbackType }),
      loop: timeline.loop ?? false,
      yoyo: timeline.yoyo ?? false,
      previewBackground: timeline.previewBackground,
      previewGradientFrom: timeline.previewGradientFrom,
      previewGradientTo: timeline.previewGradientTo,
      previewGradientAngle: timeline.previewGradientAngle,
      previewBackgroundGradient: timeline.previewBackgroundGradient,
      boundsClass: normalizeBoundsClass(
        timeline.boundsClass ?? DEFAULT_BOUNDS_CLASS
      ),
      stagePerspective: timeline.stagePerspective,
      keyframes,
      labels: normalizeTimelineLabels(timeline.labels),
      sections: normalizeTimelineSections(timeline.sections, targetIds),
      targets: timeline.targets.map((t) => {
        const draggable = t.draggable ?? { ...DEFAULT_DRAGGABLE_CONFIG };
        return {
          ...t,
          draggable: {
            ...draggable,
            bounds: sanitizeStoredDraggableBounds(draggable.bounds),
          },
        };
      }),
      activeTargetId:
        timeline.activeTargetId &&
        targetIds.has(timeline.activeTargetId)
          ? timeline.activeTargetId
          : defaultId,
      initialStates,
      targetShape: timeline.targetShape,
      initialState: timeline.initialState,
    };
  }

  const mainTarget = createAnimationTarget({
    id: DEFAULT_TARGET_ID,
    name: "Layer 1",
    type: "shape",
    selector: ".target",
    shape: timeline.targetShape ?? "square",
  });

  const keyframes = timeline.keyframes.map((k) => ({
    ...k,
    targetId: k.targetId ?? DEFAULT_TARGET_ID,
  }));

  const initialStates: Record<string, Transform[]> = {};
  if (timeline.initialState?.length) {
    initialStates[DEFAULT_TARGET_ID] = timeline.initialState;
  }

  const playbackType = timeline.playbackType ?? "normal";

  return {
    id: timeline.id,
    name: timeline.name,
    ...normalizeTimelineExtraFields(timeline),
    playbackType,
    scrollLength: timeline.scrollLength,
    scrollTriggerStart: timeline.scrollTriggerStart,
    scrollTriggerEnd: timeline.scrollTriggerEnd,
    scrollEndMode: timeline.scrollEndMode,
    ...normalizeTimelineScrollFields({ ...timeline, playbackType }),
    loop: timeline.loop ?? false,
    yoyo: timeline.yoyo ?? false,
    previewBackground: timeline.previewBackground,
    previewGradientFrom: timeline.previewGradientFrom,
    previewGradientTo: timeline.previewGradientTo,
    previewGradientAngle: timeline.previewGradientAngle,
    previewBackgroundGradient: timeline.previewBackgroundGradient,
    boundsClass: normalizeBoundsClass(
      timeline.boundsClass ?? DEFAULT_BOUNDS_CLASS
    ),
    stagePerspective: timeline.stagePerspective,
    keyframes,
    labels: normalizeTimelineLabels(timeline.labels),
    targets: [mainTarget],
    initialStates,
    activeTargetId: DEFAULT_TARGET_ID,
    targetShape: timeline.targetShape,
    initialState: timeline.initialState,
  };
}

export function normalizeTimelines(timelines: Timeline[]): Timeline[] {
  return timelines.map(normalizeTimeline);
}