import type { Keyframe, Timeline, Transform } from "@/stores/timeline-store";

export const DEFAULT_STAGE_PERSPECTIVE = 800;

export const CSS3D_TRANSFORM_TYPES = new Set([
  "rotateX",
  "rotateY",
  "moveZ",
]);

export function transformListUsesCss3d(transforms: Transform[]): boolean {
  return transforms.some((t) => CSS3D_TRANSFORM_TYPES.has(t.type));
}

export function timelineUsesCss3d(timeline: Timeline): boolean {
  for (const kf of timeline.keyframes) {
    if (transformListUsesCss3d(kf.transforms)) return true;
  }
  for (const list of Object.values(timeline.initialStates ?? {})) {
    if (list?.length && transformListUsesCss3d(list)) return true;
  }
  return false;
}

export function resolveStagePerspective(timeline: Timeline): number | undefined {
  if (!timelineUsesCss3d(timeline)) return undefined;
  const n = timeline.stagePerspective;
  if (n === 0) return undefined;
  return Number.isFinite(n) && n! > 0 ? n! : DEFAULT_STAGE_PERSPECTIVE;
}

export function stageCss3dStyle(
  timeline: Timeline
): { perspective: number; transformStyle: "preserve-3d" } | undefined {
  const perspective = resolveStagePerspective(timeline);
  if (perspective == null) return undefined;
  return { perspective, transformStyle: "preserve-3d" };
}