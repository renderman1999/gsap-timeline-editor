import type {
  AnimationTarget,
  Timeline,
  TimelineSection,
} from "@/stores/timeline-store";

export type { TimelineSection };

export function sectionIsPinned(section: TimelineSection): boolean {
  return section.scrollPin !== false;
}

export function normalizeTimelineSections(
  sections: TimelineSection[] | undefined,
  targetIds: Set<string>
): TimelineSection[] | undefined {
  if (!sections?.length) return undefined;
  const next: TimelineSection[] = [];
  const used = new Set<string>();
  sections.forEach((section) => {
    const name = section.name?.trim();
    if (!section.id || !name) return;
    const layerIds = section.layerIds.filter((id) => {
      if (!targetIds.has(id) || used.has(id)) return false;
      used.add(id);
      return true;
    });
    next.push({
      id: section.id,
      name,
      layerIds,
      ...(section.scrollPin === false ? { scrollPin: false } : {}),
    });
  });
  return next.length > 0 ? next : undefined;
}

export type ResolvedSection = TimelineSection & { layers: AnimationTarget[] };

export function resolveTimelineSections(timeline: Timeline): ResolvedSection[] {
  return (timeline.sections ?? [])
    .map((section) => ({
      ...section,
      layers: section.layerIds
        .map((id) => timeline.targets.find((target) => target.id === id))
        .filter((target): target is AnimationTarget => Boolean(target)),
    }))
    .filter((section) => section.layers.length > 0);
}

export function sectionMemberIds(timeline: Timeline): Set<string> {
  const ids = new Set<string>();
  resolveTimelineSections(timeline).forEach((section) => {
    section.layers.forEach((layer) => ids.add(layer.id));
  });
  return ids;
}

/** Layer da partizionare come pin/own/shared: chi è in una sezione non ha un trigger suo. */
export function targetsOutsideSectionScrub(timeline: Timeline): AnimationTarget[] {
  const members = sectionMemberIds(timeline);
  return timeline.targets.filter(
    (target) => !members.has(target.id) || target.timePlayback === true
  );
}

export function looseSectionTargets(timeline: Timeline): AnimationTarget[] {
  return resolveTimelineSections(timeline)
    .filter((section) => !sectionIsPinned(section))
    .flatMap((section) =>
      section.layers.filter((layer) => layer.timePlayback !== true)
    );
}

export function pinnedResolvedSections(timeline: Timeline): ResolvedSection[] {
  return resolveTimelineSections(timeline).filter(sectionIsPinned);
}

export function sectionScrubLayers(section: ResolvedSection): AnimationTarget[] {
  return section.layers.filter((layer) => layer.timePlayback !== true);
}
