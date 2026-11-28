import type { InitialStateLivePreview, Transform } from "@/stores/timeline-store";

export function cloneTransformsForPreview(
  transforms: Transform[]
): Transform[] {
  return transforms.map((t) => ({
    ...t,
    values: { ...t.values },
  }));
}

export function resolveInitialStatesForPreview(
  timelineId: string,
  initialStates: Record<string, Transform[]>,
  livePreview: InitialStateLivePreview | null
): Record<string, Transform[]> {
  if (
    !livePreview ||
    livePreview.timelineId !== timelineId ||
    livePreview.targetId.length === 0
  ) {
    return initialStates;
  }
  return {
    ...initialStates,
    [livePreview.targetId]: cloneTransformsForPreview(livePreview.transforms),
  };
}