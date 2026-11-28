import type { Timeline, Transform } from "@/stores/timeline-store";

export type TimelineEditorMode = "gsap";

export function normalizeEditorMode(
  mode?: TimelineEditorMode | "fullpage",
  _timeline?: Partial<Timeline>
): TimelineEditorMode {
  return "gsap";
}

export function timelineIsGsapEditor(_timeline: Timeline): boolean {
  return true;
}

export function initialStatesForAnimation(
  _timeline: Timeline,
  initialStates: Record<string, Transform[] | undefined>
): Record<string, Transform[] | undefined> {
  return initialStates;
}

export function newTimelinePatchForEditorMode(
  _mode: TimelineEditorMode | "fullpage",
  options?: {
    name?: string;
    playbackType?: "normal" | "scroll";
    scrollLength?: number;
    loop?: boolean;
    yoyo?: boolean;
  }
): Partial<Omit<Timeline, "id">> {
  const playbackType = options?.playbackType ?? "normal";
  return {
    name: options?.name?.trim() || "New Animation",
    editorMode: "gsap",
    playbackType,
    scrollLength:
      playbackType === "scroll" ? options?.scrollLength ?? 300 : undefined,
    scrollLayout: playbackType === "scroll" ? "default" : undefined,
    loop: options?.loop ?? false,
    yoyo: options?.yoyo ?? false,
  };
}