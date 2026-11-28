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
import type { PixiLayerSettings } from "@/lib/pixi-scene";
import type { Model3dInteractionConfig } from "@/lib/model3d-interaction";
import type { ScrollLayout } from "@/lib/fullpage-scroll";
import type { TimelineEditorMode } from "@/lib/timeline-editor-mode";

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
  | "cssRule"
  | "autoAlpha"
  | "transformOrigin"
  | "svgOrigin"
  | "cssProp"
  | "scrambleText"
  | "physics2D"
  | "physicsProps"
  | "scrollTo"
  | "flip";

export interface Transform {
  id: string;
  type: TransformType;
  values: Record<string, number | string>;
}

export type StaggerFrom = "start" | "center" | "end" | "edges" | "random";

export interface KeyframeStagger {
  amount?: number;
  from?: StaggerFrom;
  grid?: string;
  axis?: "x" | "y";
  ease?: string;
}

export type OverwriteMode = "false" | "true" | "auto";

export type EasePluginKind =
  | "steps"
  | "rough"
  | "slow"
  | "expoScale"
  | "custom"
  | "wiggle"
  | "customBounce";

export interface KeyframeEaseExtra {
  param?: number;
  param2?: number;
  plugin?: EasePluginKind;
  steps?: number;
  strength?: number;
  points?: number;
  taper?: "none" | "in" | "out" | "both";
  randomize?: boolean;
  clamp?: boolean;
  linearRatio?: number;
  power?: number;
  yoyoMode?: boolean;
  expoStart?: number;
  expoEnd?: number;
  curve?: string;
  wiggles?: number;
  wiggleType?: "easeOut" | "easeInOut" | "anticipate" | "uniform" | "random";
  squash?: number;
  endAtStart?: boolean;
}

export interface Keyframe {
  id: string;
  targetId?: string;
  /** Inizio sulla timeline dell'editor, in secondi. */
  delay: number;
  /** Position parameter GSAP se non è un numero assoluto: "+=0.5", "<", ">", label. */
  position?: string;
  duration: number;
  easing: string;
  easeExtra?: KeyframeEaseExtra;
  /** Secondi tra target (numero). Con staggerConfig diventa l'oggetto GSAP. */
  stagger?: number;
  staggerConfig?: KeyframeStagger;
  repeat?: number;
  yoyo?: boolean;
  repeatDelay?: number;
  yoyoEase?: string;
  overwrite?: OverwriteMode;
  immediateRender?: boolean;
  clearProps?: string;
  /** Coppie proprietà, es. "x: 0, opacity: 0" */
  startAt?: string;
  onStart?: string;
  onUpdate?: string;
  onComplete?: string;
  onRepeat?: string;
  onReverseComplete?: string;
  transforms: Transform[];
}

export type TextSplitMode = "none" | "chars" | "words" | "lines";

export type AnimationTargetType =
  | "shape"
  | "text"
  | "image"
  | "svg"
  | "model3d"
  | "code"
  | "pixi";

export interface TargetLayerStyle {
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right";
  /** Testo a larghezza viewport (100vw), anche dentro stage centrato */
  textFullViewportWidth?: boolean;
  /** Larghezza contenitore testo (max-width) per a capo su più righe, es. 32rem */
  textMaxWidth?: string;
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
  /** Larghezza in px del layer immagine. Assente = 160. */
  imageWidth?: number;
  /** GLB/GLTF: data URL o URL remota */
  model3dUrl?: string;
  model3dScene?: Model3dSceneSettings;
  /** Nomi mesh rilevati dopo il load (per UI materiali). */
  model3dMeshNames?: string[];
  model3dInteractions?: Model3dInteractionConfig;
  /** Script scena Pixi: (PIXI, app, root, layerId) => void */
  pixiScene?: string;
  pixiSettings?: PixiLayerSettings;
  /** Markup SVG inline (path, gruppi, ecc.) */
  svgContent?: string;
  /** Markup HTML libero (layer Codice) */
  codeHtml?: string;
  /** Script eseguito su root/layerId in anteprima ed export (layer Codice) */
  codeJs?: string;
  /** Sotto-selettore per DrawSVG/MorphSVG, default path */
  svgPathSelector?: string;
  /** Trascina il layer in preview / export (Draggable) */
  draggable?: TargetDraggableConfig;
  /** ScrollTrigger dedicato al layer (start/end propri, scrub indipendente) */
  scrollTriggerOwn?: boolean;
  /** GSAP start del layer; se vuoto eredita dalla timeline */
  scrollTriggerStart?: string;
  /** GSAP end del layer; se vuoto eredita end/scrollLength timeline */
  scrollTriggerEnd?: string;
  /** Lunghezza +=% per end relativo del layer (se scrollTriggerEnd assente) */
  scrollTriggerScrollLength?: number;
  /** Elemento trigger; vuoto = il layer stesso */
  scrollTriggerSelector?: string;
  /** In playback scroll: pin GSAP (blocca il layer mentre la timeline scrubba i transform) */
  scrollPin?: boolean;
  /** In un progetto scroll: timeline a tempo, senza ScrollTrigger. Parte da sola. */
  timePlayback?: boolean;
  style?: TargetLayerStyle;
}

export interface TimelineSection {
  id: string;
  name: string;
  layerIds: string[];
  /** In un progetto scroll la sezione è un pin unico. false = gruppo nel flusso. */
  scrollPin?: boolean;
}

export interface TimelineLabel {
  id: string;
  name: string;
  /** Secondi dall'inizio. Diventa tl.addLabel(name, time). */
  time: number;
}

export interface Timeline {
  id: string;
  name: string;
  editorMode?: TimelineEditorMode;
  playbackType: "normal" | "scroll";
  scrollLength?: number;
  /** GSAP ScrollTrigger start, es. "top center" o "top 50%" */
  scrollTriggerStart?: string;
  /** GSAP ScrollTrigger end; se assente si usa +=scrollLength% */
  scrollTriggerEnd?: string;
  /** relative: end +=scrollLength%; absolute: scrollTriggerEnd come posizione */
  scrollEndMode?: "relative" | "absolute";
  scrollLayout?: ScrollLayout;
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
  /** Label GSAP (tl.addLabel), visibili sul righello. */
  labels?: TimelineLabel[];
  targets: AnimationTarget[];
  /** Contenitori: più layer dentro un unico blocco (e, se pin, un solo scroller-end). */
  sections?: TimelineSection[];
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
  | "star"
  // Icons
  | "heart"
  | "bell"
  | "menu"
  | "audio-lines";

export type LayerStyleLivePreview = {
  timelineId: string;
  targetId: string;
  style: TargetLayerStyle;
};

export type InitialStateLivePreview = {
  timelineId: string;
  targetId: string;
  transforms: Transform[];
};

interface TimelineState {
  timelines: Timeline[];
  activeTimelineId: string | null;
  targetShape: TargetShape;
  isPlaying: boolean;
  currentTime: number;
  zoom: number;
  /** Bozza stile layer (dialog) riflessa subito nella preview, senza persistere fino a Salva. */
  layerStyleLivePreview: LayerStyleLivePreview | null;
  /** Bozza initial state (dialog) applicata subito in preview. */
  initialStateLivePreview: InitialStateLivePreview | null;
  /** Nome file progetto aperto (per salva diretto / Salva con nome). */
  projectFileName: string | null;

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
  setScrollPin: (
    timelineId: string,
    targetId: string,
    enabled: boolean
  ) => void;
  removeTarget: (timelineId: string, targetId: string) => void;
  duplicateTarget: (timelineId: string, targetId: string) => void;
  moveTarget: (
    timelineId: string,
    targetId: string,
    direction: "up" | "down"
  ) => void;
  setActiveTarget: (timelineId: string, targetId: string) => void;
  addSection: (timelineId: string) => void;
  updateSection: (
    timelineId: string,
    sectionId: string,
    updates: Partial<Pick<TimelineSection, "name" | "scrollPin">>
  ) => void;
  deleteSection: (timelineId: string, sectionId: string) => void;
  assignLayerToSection: (
    timelineId: string,
    targetId: string,
    sectionId: string | null
  ) => void;

  setTargetShape: (shape: TargetShape) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  setLayerStyleLivePreview: (preview: LayerStyleLivePreview | null) => void;
  setInitialStateLivePreview: (preview: InitialStateLivePreview | null) => void;
  setProjectFileName: (filename: string | null) => void;

  getActiveTimeline: () => Timeline | null;
  generateUniqueTimelineName: (baseName: string) => string;
  recreateDemo: () => void;
  addPinnedScrollDemo: () => void;
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

export const PIN_SCROLL_DEMO_ID = "demo-pin-layers";

function createPinnedScrollDemo(): Timeline {
  const rosso = createAnimationTarget({
    id: "pin-rosso",
    name: "Rosso",
    type: "shape",
    shape: "square",
    scrollPin: true,
    scrollTriggerStart: "top top",
    scrollTriggerScrollLength: 100,
    style: { color: "#e11d48" },
  });
  const blu = createAnimationTarget({
    id: "pin-blu",
    name: "Blu",
    type: "shape",
    shape: "circle",
    scrollPin: true,
    scrollTriggerStart: "top top",
    scrollTriggerScrollLength: 100,
    style: { color: "#2563eb" },
  });
  const verde = createAnimationTarget({
    id: "pin-verde",
    name: "Verde",
    type: "shape",
    shape: "triangle",
    scrollPin: true,
    scrollTriggerStart: "top top",
    scrollTriggerScrollLength: 100,
    style: { color: "#16a34a" },
  });
  return normalizeTimeline({
    id: PIN_SCROLL_DEMO_ID,
    name: "Demo 3 pin",
    playbackType: "scroll",
    scrollLength: 100,
    scrollTriggerStart: "top top",
    loop: false,
    yoyo: false,
    previewBackground: "#0a0a0a",
    keyframes: [
      {
        id: "pin-rosso-kf",
        targetId: rosso.id,
        delay: 0,
        duration: 1000,
        easing: "power2.inOut",
        transforms: [
          { id: "pin-rosso-x", type: "move", values: { x: 180, y: 0 } },
          { id: "pin-rosso-s", type: "scale", values: { scaleX: 1.35, scaleY: 1.35 } },
        ],
      },
      {
        id: "pin-blu-kf",
        targetId: blu.id,
        delay: 0,
        duration: 1000,
        easing: "power2.inOut",
        transforms: [
          { id: "pin-blu-r", type: "rotate", values: { rotation: 180 } },
          { id: "pin-blu-x", type: "move", values: { x: -140, y: 0 } },
        ],
      },
      {
        id: "pin-verde-kf",
        targetId: verde.id,
        delay: 0,
        duration: 1000,
        easing: "power2.inOut",
        transforms: [
          { id: "pin-verde-y", type: "move", values: { x: 0, y: -80 } },
          { id: "pin-verde-o", type: "opacity", values: { opacity: 1 } },
        ],
      },
    ],
    targets: [rosso, blu, verde],
    activeTargetId: rosso.id,
    initialStates: {
      [rosso.id]: [
        { id: "pin-rosso-i", type: "move", values: { x: -180, y: 0 } },
      ],
      [blu.id]: [
        { id: "pin-blu-i", type: "rotate", values: { rotation: -90 } },
        { id: "pin-blu-im", type: "move", values: { x: 140, y: 0 } },
      ],
      [verde.id]: [
        { id: "pin-verde-i", type: "move", values: { x: 0, y: 90 } },
        { id: "pin-verde-io", type: "opacity", values: { opacity: 0.15 } },
      ],
    },
  });
}

const defaultNewTimeline = (): Omit<Timeline, "id"> => {
  const target = createAnimationTarget({ name: "Layer 1", type: "shape" });
  return {
    name: "New Animation",
    editorMode: "gsap",
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

function newShortId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function uniqueTargetName(
  targets: AnimationTarget[],
  baseName: string
): string {
  const names = new Set(targets.map((t) => t.name));
  if (!names.has(baseName)) return baseName;
  let counter = 2;
  while (names.has(`${baseName} ${counter}`)) {
    counter++;
  }
  return `${baseName} ${counter}`;
}

function cloneKeyframeForTarget(
  keyframe: Keyframe,
  newTargetId: string
): Keyframe {
  return {
    ...keyframe,
    id: newShortId(),
    targetId: newTargetId,
    transforms: keyframe.transforms.map((tr) => ({
      ...tr,
      id: newShortId(),
      values: { ...tr.values },
    })),
  };
}

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
      layerStyleLivePreview: null,
      initialStateLivePreview: null,
      projectFileName: null,

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
        if (updates.stagger != null && updates.stagger > 0) {
          roundedUpdates.stagger = roundDelay(updates.stagger);
        } else if ("stagger" in updates) {
          roundedUpdates.stagger = undefined;
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

      setScrollPin: (timelineId, targetId, enabled) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  targets: (timeline.targets ?? []).map((t) =>
                    t.id === targetId
                      ? {
                          ...t,
                          scrollPin: enabled,
                          ...(enabled ? { timePlayback: false } : {}),
                        }
                      : t
                  ),
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
              sections: timeline.sections
                ?.map((section) => ({
                  ...section,
                  layerIds: section.layerIds.filter((id) => id !== targetId),
                }))
                .filter((section) => section.layerIds.length > 0),
              keyframes: timeline.keyframes.filter(
                (k) => k.targetId !== targetId
              ),
            };
          }),
        }));
      },

      duplicateTarget: (timelineId, targetId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) => {
            if (timeline.id !== timelineId) return timeline;
            const targets = timeline.targets ?? [];
            const idx = targets.findIndex((t) => t.id === targetId);
            const source = targets[idx];
            if (!source) return timeline;

            const raw = JSON.parse(
              JSON.stringify(source)
            ) as AnimationTarget;
            const { id: _id, selector: _selector, ...rest } = raw;
            const clone = createAnimationTarget({
              ...rest,
              name: uniqueTargetName(
                targets,
                `${source.name.trim() || "Layer"} copia`
              ),
              scrollPin: false,
            });

            const nextTargets = [...targets];
            nextTargets.splice(idx + 1, 0, clone);

            const initialStates = { ...(timeline.initialStates ?? {}) };
            const sourceInitial = initialStates[targetId];
            if (sourceInitial?.length) {
              initialStates[clone.id] = JSON.parse(
                JSON.stringify(sourceInitial)
              ) as Transform[];
            }

            const layerKeyframes = timeline.keyframes.filter(
              (k) => (k.targetId ?? timeline.activeTargetId) === targetId
            );
            const clonedKeyframes = layerKeyframes.map((k) =>
              cloneKeyframeForTarget(k, clone.id)
            );

            return {
              ...timeline,
              targets: nextTargets,
              activeTargetId: clone.id,
              initialStates,
              keyframes: [...timeline.keyframes, ...clonedKeyframes],
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

      addSection: (timelineId) => {
        const timeline = get().timelines.find((item) => item.id === timelineId);
        if (!timeline) return;
        const index = (timeline.sections?.length ?? 0) + 1;
        const section: TimelineSection = {
          id: newShortId(),
          name: `Sezione ${index}`,
          layerIds: [],
          ...(timeline.playbackType === "scroll" ? {} : { scrollPin: false }),
        };
        set((state) => ({
          timelines: state.timelines.map((item) =>
            item.id === timelineId
              ? { ...item, sections: [...(item.sections ?? []), section] }
              : item
          ),
        }));
      },

      updateSection: (timelineId, sectionId, updates) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  sections: timeline.sections?.map((section) =>
                    section.id === sectionId
                      ? { ...section, ...updates }
                      : section
                  ),
                }
              : timeline
          ),
        }));
      },

      deleteSection: (timelineId, sectionId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  sections: timeline.sections?.filter(
                    (section) => section.id !== sectionId
                  ),
                }
              : timeline
          ),
        }));
      },

      assignLayerToSection: (timelineId, targetId, sectionId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) => {
            if (timeline.id !== timelineId) return timeline;
            const sections = (timeline.sections ?? []).map((section) => ({
              ...section,
              layerIds: section.layerIds.filter((id) => id !== targetId),
            }));
            if (!sectionId) {
              return { ...timeline, sections };
            }
            return {
              ...timeline,
              sections: sections.map((section) =>
                section.id === sectionId
                  ? { ...section, layerIds: [...section.layerIds, targetId] }
                  : section
              ),
            };
          }),
        }));
      },

      setTargetShape: (shape) => set({ targetShape: shape }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setZoom: (zoom) => set({ zoom }),

      setLayerStyleLivePreview: (preview) =>
        set({ layerStyleLivePreview: preview }),

      setInitialStateLivePreview: (preview) =>
        set({ initialStateLivePreview: preview }),

      setProjectFileName: (filename) => set({ projectFileName: filename }),

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

      addPinnedScrollDemo: () => {
        const demoTimeline = createPinnedScrollDemo();
        set((state) => ({
          timelines: state.timelines.some((timeline) => timeline.id === demoTimeline.id)
            ? state.timelines.map((timeline) =>
                timeline.id === demoTimeline.id ? demoTimeline : timeline
              )
            : [...state.timelines, demoTimeline],
          activeTimelineId: demoTimeline.id,
          isPlaying: false,
          currentTime: 0,
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
