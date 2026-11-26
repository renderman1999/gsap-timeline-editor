import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createAnimationTarget,
  normalizeTimeline,
  normalizeTimelines,
} from "@/lib/timeline-migrate";
import type { TargetDraggableConfig } from "@/lib/gsap-draggable";
import { roundDelay, roundDuration } from "@/utils/round";
import type { Model3dSceneSettings } from "@/lib/model3d-scene";
import type { Model3dInteractionConfig } from "@/lib/model3d-interaction";

export type TransformType =
  | "move"
  | "rotate"
  | "rotateX"
  | "rotateY"
  | "moveZ"
  | "opacity"
  | "skew"
  | "filter"
  | "scale"
  | "drawSvg"
  | "morphSvg"
  | "motionPath"
  | "cssVar"
  | "cssRule";

export interface Transform {
  id: string;
  type: TransformType;
  values: Record<string, number | string>;
}

export interface Keyframe {
  id: string;
  targetId?: string;
  delay: number;
  duration: number;
  easing: string;
  /** Secondi tra elementi spezzati (SplitText) */
  stagger?: number;
  transforms: Transform[];
}

export type TextSplitMode = "none" | "chars" | "words" | "lines";

export type AnimationTargetType =
  | "shape"
  | "text"
  | "image"
  | "svg"
  | "model3d";

export interface TargetLayerStyle {
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right";
  /** es. 0 4px 24px rgba(0,0,0,0.45) */
  boxShadow?: string;
  /** es. 0 2px 8px #000 */
  textShadow?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string;
  outlineWidth?: string;
  outlineStyle?: string;
  outlineColor?: string;
  outlineOffset?: string;
  opacity?: string;
  /** es. blur(4px) drop-shadow(...) */
  filter?: string;
  textStrokeWidth?: string;
  textStrokeColor?: string;
  customCss?: string;
}

export interface AnimationTarget {
  id: string;
  name: string;
  type: AnimationTargetType;
  selector: string;
  shape?: TargetShape;
  text?: string;
  /** Spezza il testo per animare char / word / line (SplitText) */
  textSplit?: TextSplitMode;
  /** Selettore path SVG di default per MotionPath */
  motionPathSelector?: string;
  imageUrl?: string;
  /** GLB/GLTF: data URL o URL remota */
  model3dUrl?: string;
  model3dScene?: Model3dSceneSettings;
  /** Nomi mesh rilevati dopo il load (per UI materiali). */
  model3dMeshNames?: string[];
  model3dInteractions?: Model3dInteractionConfig;
  /** Markup SVG inline (path, gruppi, ecc.) */
  svgContent?: string;
  /** Sotto-selettore per DrawSVG/MorphSVG, default path */
  svgPathSelector?: string;
  /** Trascina il layer in preview / export (Draggable) */
  draggable?: TargetDraggableConfig;
  /** In playback scroll: pin GSAP (blocca il layer mentre la timeline scrubba i transform) */
  scrollPin?: boolean;
  style?: TargetLayerStyle;
}

export interface Timeline {
  id: string;
  name: string;
  playbackType: "normal" | "scroll";
  scrollLength?: number;
  /** GSAP ScrollTrigger start, es. "top center" o "top 50%" */
  scrollTriggerStart?: string;
  /** GSAP ScrollTrigger end; se assente si usa +=scrollLength% */
  scrollTriggerEnd?: string;
  /** relative: end +=scrollLength%; absolute: scrollTriggerEnd come posizione */
  scrollEndMode?: "relative" | "absolute";
  loop: boolean;
  yoyo: boolean;
  /** Colore sfondo pagina (se non usi gradiente) */
  previewBackground?: string;
  /** Colore inizio gradiente (con alpha) */
  previewGradientFrom?: string;
  /** Colore fine gradiente (con alpha) */
  previewGradientTo?: string;
  /** Angolo gradiente in gradi */
  previewGradientAngle?: number;
  /** CSS gradiente precalcolato (export / legacy) */
  previewBackgroundGradient?: string;
  /** Classe del contenitore bounds (senza punto), es. stage-bounds */
  boundsClass?: string;
  /** Perspective CSS (px) sullo stage quando ci sono transform 3D; default 800 */
  stagePerspective?: number;
  keyframes: Keyframe[];
  targets: AnimationTarget[];
  activeTargetId: string;
  initialStates?: Record<string, Transform[]>;
  /** @deprecated Legacy single-target fields */
  targetShape?: TargetShape;
  initialState?: Transform[];
}

export type TargetShape =
  // Basic shapes
  | "square"
  | "circle"
  | "triangle"
  // Icons
  | "heart"
  | "bell"
  | "menu"
  | "audio-lines";

interface TimelineState {
  timelines: Timeline[];
  activeTimelineId: string | null;
  targetShape: TargetShape;
  isPlaying: boolean;
  currentTime: number;
  zoom: number;

  // Actions
  addTimeline: (timeline: Partial<Omit<Timeline, "id">>) => void;
  updateTimeline: (id: string, updates: Partial<Timeline>) => void;
  deleteTimeline: (id: string) => void;
  setActiveTimeline: (id: string) => void;

  addKeyframe: (timelineId: string, keyframe: Omit<Keyframe, "id">) => void;
  updateKeyframe: (
    timelineId: string,
    keyframeId: string,
    updates: Partial<Keyframe>
  ) => void;
  deleteKeyframe: (timelineId: string, keyframeId: string) => void;

  setInitialState: (timelineId: string, targetId: string, initialState: Transform[]) => void;
  clearInitialState: (timelineId: string, targetId: string) => void;

  addTarget: (
    timelineId: string,
    partial?: Partial<AnimationTarget>
  ) => void;
  updateTarget: (
    timelineId: string,
    targetId: string,
    updates: Partial<AnimationTarget>
  ) => void;
  setExclusiveScrollPin: (
    timelineId: string,
    targetId: string,
    enabled: boolean
  ) => void;
  removeTarget: (timelineId: string, targetId: string) => void;
  moveTarget: (
    timelineId: string,
    targetId: string,
    direction: "up" | "down"
  ) => void;
  setActiveTarget: (timelineId: string, targetId: string) => void;

  setTargetShape: (shape: TargetShape) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;

  getActiveTimeline: () => Timeline | null;
  generateUniqueTimelineName: (baseName: string) => string;
  recreateDemo: () => void;
  loadProject: (payload: {
    timelines: Timeline[];
    activeTimelineId: string | null;
  }) => void;
}

const createDemoTimelineRaw = () => ({
  id: "demo",
  name: "Demo Animation",
  playbackType: "normal" as const,
  loop: true,
  yoyo: true,
  targetShape: "heart" as const,
  keyframes: [
    {
      id: "heartbeat-1",
      delay: 0,
      duration: 400,
      easing: "power2.out",
      transforms: [
        {
          id: "heart-scale-1",
          type: "scale",
          values: {
            scaleX: 1.2,
            scaleY: 1.2,
          },
        },
        {
          id: "zup7zzrzr",
          type: "move",
          values: {
            x: 0,
            y: 0,
          },
        },
        {
          id: "tc6f2ux9z",
          type: "opacity",
          values: {
            opacity: 1,
          },
        },
        {
          id: "ukoog22e9",
          type: "skew",
          values: {
            skewX: 0,
            skewY: 0,
          },
        },
      ],
    },
    {
      id: "heartbeat-2",
      delay: 0.4,
      duration: 250,
      easing: "power2.in",
      transforms: [
        {
          id: "heart-scale-2",
          type: "scale",
          values: {
            scaleX: 1,
            scaleY: 1,
          },
        },
      ],
    },
    {
      delay: 0.65,
      duration: 400,
      easing: "power3.out",
      transforms: [
        {
          id: "5jijszqpm",
          type: "scale",
          values: {
            scaleX: 1.3,
            scaleY: 1.3,
          },
        },
      ],
      id: "uj13pdefb",
    },
    {
      delay: 1.05,
      duration: 600,
      easing: "power3.in",
      transforms: [
        {
          id: "seu19c2wo",
          type: "scale",
          values: {
            scaleX: 1,
            scaleY: 1,
          },
        },
      ],
      id: "265pf8dj5",
    },
  ],
  initialState: [
    {
      id: "0r0lcom0c",
      type: "move",
      values: {
        x: -150,
        y: 0,
      },
    },
    {
      id: "t0uto5tvd",
      type: "opacity",
      values: {
        opacity: 0,
      },
    },
    {
      id: "mqp92h3b5",
      type: "skew",
      values: {
        skewX: -20,
        skewY: 0,
      },
    },
  ],
});

const createDemoTimeline = (): Timeline =>
  normalizeTimeline(
    createDemoTimelineRaw() as unknown as Parameters<typeof normalizeTimeline>[0]
  );

const defaultNewTimeline = (): Omit<Timeline, "id"> => {
  const target = createAnimationTarget({ name: "Layer 1", type: "shape" });
  return {
    name: "New Animation",
    playbackType: "normal",
    loop: false,
    yoyo: false,
    previewBackground: "#0a0a0a",
    boundsClass: "stage-bounds",
    keyframes: [],
    targets: [target],
    activeTargetId: target.id,
    initialStates: {},
  };
};

const INITIAL_TIMELINE_ID = "initial";

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      timelines: [
        normalizeTimeline({
          ...defaultNewTimeline(),
          id: INITIAL_TIMELINE_ID,
        }),
      ],
      activeTimelineId: INITIAL_TIMELINE_ID,
      targetShape: "heart",
      isPlaying: false,
      currentTime: 0,
      zoom: 1,

      addTimeline: (timeline) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newTimeline = normalizeTimeline({
          ...defaultNewTimeline(),
          ...timeline,
          id,
        });
        set((state) => ({
          timelines: [...state.timelines, newTimeline],
          activeTimelineId: id,
        }));
      },

      updateTimeline: (id, updates) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === id ? { ...timeline, ...updates } : timeline
          ),
        }));
      },

      deleteTimeline: (id) => {
        set((state) => {
          const newTimelines = state.timelines.filter((t) => t.id !== id);
          const newActiveId =
            state.activeTimelineId === id
              ? newTimelines.length > 0
                ? newTimelines[0].id
                : null
              : state.activeTimelineId;

          return {
            timelines: newTimelines,
            activeTimelineId: newActiveId,
          };
        });
      },

      setActiveTimeline: (id) => {
        set({ activeTimelineId: id });
      },

      addKeyframe: (timelineId, keyframe) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newKeyframe = {
          ...keyframe,
          id,
          delay: roundDelay(keyframe.delay),
          duration: roundDuration(keyframe.duration),
          ...(keyframe.stagger != null && keyframe.stagger > 0
            ? { stagger: roundDelay(keyframe.stagger) }
            : {}),
        };

        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? { ...timeline, keyframes: [...timeline.keyframes, newKeyframe] }
              : timeline
          ),
        }));
      },

      updateKeyframe: (timelineId, keyframeId, updates) => {
        // Round delay and duration if they are being updated
        const roundedUpdates = { ...updates };
        if (updates.delay !== undefined) {
          roundedUpdates.delay = roundDelay(updates.delay);
        }
        if (updates.duration !== undefined) {
          roundedUpdates.duration = roundDuration(updates.duration);
        }
        if (updates.stagger !== undefined) {
          roundedUpdates.stagger = roundDelay(updates.stagger);
        }

        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  keyframes: timeline.keyframes.map((keyframe) =>
                    keyframe.id === keyframeId
                      ? { ...keyframe, ...roundedUpdates }
                      : keyframe
                  ),
                }
              : timeline
          ),
        }));
      },

      deleteKeyframe: (timelineId, keyframeId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  keyframes: timeline.keyframes.filter(
                    (k) => k.id !== keyframeId
                  ),
                }
              : timeline
          ),
        }));
      },

      setInitialState: (timelineId, targetId, initialState) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  initialStates: {
                    ...(timeline.initialStates ?? {}),
                    [targetId]: initialState,
                  },
                }
              : timeline
          ),
        }));
      },

      clearInitialState: (timelineId, targetId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) => {
            if (timeline.id !== timelineId) return timeline;
            const initialStates = { ...(timeline.initialStates ?? {}) };
            delete initialStates[targetId];
            return { ...timeline, initialStates };
          }),
        }));
      },

      addTarget: (timelineId, partial) => {
        const timeline = get().timelines.find((t) => t.id === timelineId);
        const layerIndex = (timeline?.targets?.length ?? 0) + 1;
        const target = createAnimationTarget({
          name: partial?.name ?? `Layer ${layerIndex}`,
          ...partial,
        });
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  targets: [...(timeline.targets ?? []), target],
                  activeTargetId: target.id,
                }
              : timeline
          ),
        }));
      },

      updateTarget: (timelineId, targetId, updates) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  targets: (timeline.targets ?? []).map((t) =>
                    t.id === targetId ? { ...t, ...updates } : t
                  ),
                }
              : timeline
          ),
        }));
      },

      setExclusiveScrollPin: (timelineId, targetId, enabled) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  targets: (timeline.targets ?? []).map((t) => ({
                    ...t,
                    scrollPin: enabled && t.id === targetId,
                  })),
                }
              : timeline
          ),
        }));
      },

      moveTarget: (timelineId, targetId, direction) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) => {
            if (timeline.id !== timelineId) return timeline;
            const targets = [...(timeline.targets ?? [])];
            const idx = targets.findIndex((t) => t.id === targetId);
            if (idx < 0) return timeline;
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (swapWith < 0 || swapWith >= targets.length) return timeline;
            const next = [...targets];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return { ...timeline, targets: next };
          }),
        }));
      },

      removeTarget: (timelineId, targetId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) => {
            if (timeline.id !== timelineId) return timeline;
            const targets = (timeline.targets ?? []).filter(
              (t) => t.id !== targetId
            );
            if (targets.length === 0) return timeline;

            const initialStates = { ...(timeline.initialStates ?? {}) };
            delete initialStates[targetId];

            let activeTargetId = timeline.activeTargetId;
            if (activeTargetId === targetId) {
              activeTargetId = targets[0].id;
            }

            return {
              ...timeline,
              targets,
              activeTargetId,
              initialStates,
              keyframes: timeline.keyframes.filter(
                (k) => k.targetId !== targetId
              ),
            };
          }),
        }));
      },

      setActiveTarget: (timelineId, targetId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? { ...timeline, activeTargetId: targetId }
              : timeline
          ),
        }));
      },

      setTargetShape: (shape) => set({ targetShape: shape }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setZoom: (zoom) => set({ zoom }),

      getActiveTimeline: () => {
        const state = get();
        const timeline = state.timelines.find(
          (t) => t.id === state.activeTimelineId
        );
        if (!timeline) return null;
        if (timeline.targets?.length) return timeline;
        return normalizeTimeline(timeline);
      },

      generateUniqueTimelineName: (baseName) => {
        const state = get();
        const existingNames = state.timelines.map((t) => t.name);

        if (!existingNames.includes(baseName)) {
          return baseName;
        }

        let counter = 2;
        while (existingNames.includes(`${baseName} ${counter}`)) {
          counter++;
        }

        return `${baseName} ${counter}`;
      },

      recreateDemo: () => {
        const demoTimeline = normalizeTimeline(createDemoTimeline());
        set((state) => ({
          timelines: [...state.timelines, demoTimeline],
          activeTimelineId: demoTimeline.id,
        }));
      },

      loadProject: ({ timelines, activeTimelineId }) => {
        const normalized = normalizeTimelines(timelines);
        if (normalized.length === 0) return;

        const nextActive =
          activeTimelineId &&
          normalized.some((t) => t.id === activeTimelineId)
            ? activeTimelineId
            : normalized[0].id;

        set({
          timelines: normalized,
          activeTimelineId: nextActive,
          isPlaying: false,
          currentTime: 0,
        });
      },
    }),
    {
      name: "timeline-storage",
      version: 2,
      skipHydration: true,
      migrate: (persistedState) => {
        const state = persistedState as { timelines?: Timeline[] };
        if (state.timelines) {
          state.timelines = normalizeTimelines(state.timelines);
        }
        return persistedState;
      },
    }
  )
);
