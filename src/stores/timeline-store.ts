import { create } from "zustand";
import { persist } from "zustand/middleware";
import { roundDelay, roundDuration } from "@/utils/round";

export type TransformType =
  | "move"
  | "rotate"
  | "opacity"
  | "skew"
  | "filter"
  | "scale";

export interface Transform {
  id: string;
  type: TransformType;
  values: Record<string, number | string>;
}

export interface Keyframe {
  id: string;
  delay: number;
  duration: number;
  easing: string;
  transforms: Transform[];
}

export interface Timeline {
  id: string;
  name: string;
  playbackType: "normal" | "scroll";
  scrollLength?: number;
  loop: boolean;
  yoyo: boolean;
  keyframes: Keyframe[];
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
  addTimeline: (timeline: Omit<Timeline, "id">) => void;
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

  setInitialState: (timelineId: string, initialState: Transform[]) => void;
  clearInitialState: (timelineId: string) => void;

  setTargetShape: (shape: TargetShape) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;

  getActiveTimeline: () => Timeline | null;
  generateUniqueTimelineName: (baseName: string) => string;
}

const createDemoTimeline = (): Timeline => ({
  id: "demo",
  name: "Demo Animation",
  playbackType: "normal",
  loop: true,
  yoyo: false,
  targetShape: "heart",
  keyframes: [
    {
      id: "heartbeat-1",
      delay: 0,
      duration: 200,
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
      ],
    },
    {
      id: "heartbeat-2",
      delay: 0.2,
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
      delay: 0.45,
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
      delay: 0.85,
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
});

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      timelines: [createDemoTimeline()],
      activeTimelineId: "demo",
      targetShape: "heart",
      isPlaying: false,
      currentTime: 0,
      zoom: 1,

      addTimeline: (timeline) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newTimeline = {
          ...timeline,
          id,
          targetShape: timeline.targetShape || "square",
        };
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

        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? {
                  ...timeline,
                  keyframes: timeline.keyframes.map((keyframe) =>
                    keyframe.id === keyframeId
                      ? { ...keyframe, ...updates }
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

      setInitialState: (timelineId, initialState) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? { ...timeline, initialState }
              : timeline
          ),
        }));
      },

      clearInitialState: (timelineId) => {
        set((state) => ({
          timelines: state.timelines.map((timeline) =>
            timeline.id === timelineId
              ? { ...timeline, initialState: undefined }
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
        return (
          state.timelines.find((t) => t.id === state.activeTimelineId) || null
        );
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
    }),
    {
      name: "timeline-storage",
    }
  )
);
