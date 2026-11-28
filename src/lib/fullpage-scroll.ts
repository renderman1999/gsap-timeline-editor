import type { Timeline } from "@/stores/timeline-store";
import { sectionMemberIds } from "@/lib/timeline-sections";

export type ScrollLayout = "default";

export function normalizeScrollLayout(
  _layout?: ScrollLayout | "fullpage"
): ScrollLayout {
  return "default";
}

export function usesSplitScrollPin(timeline: Timeline): boolean {
  if (timeline.playbackType !== "scroll") return false;
  const members = sectionMemberIds(timeline);
  if (
    timeline.targets.some(
      (target) =>
        target.scrollPin === true &&
        target.timePlayback !== true &&
        !members.has(target.id)
    )
  ) {
    return true;
  }
  return (timeline.sections ?? []).some((section) => {
    if (section.scrollPin === false) return false;
    return section.layerIds.some((id) => {
      const target = timeline.targets.find((item) => item.id === id);
      return Boolean(target && target.timePlayback !== true);
    });
  });
}

export function timelineUsesScrollPinLayout(timeline: Timeline): boolean {
  return usesSplitScrollPin(timeline);
}

/** Layer nello stage pin (o tutti se non c'è pin split). */
export function layerBelongsToFullpageStage(
  timeline: Timeline,
  target: { scrollPin?: boolean }
): boolean {
  return !usesSplitScrollPin(timeline) || Boolean(target.scrollPin);
}