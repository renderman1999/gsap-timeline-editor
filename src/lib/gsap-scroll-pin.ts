import type { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";
import { resolveScrollEnd } from "@/lib/scroll-trigger-config";

/** Stesso ritardo dell'esempio GSAP (`scrub: 1`). */
export const SCROLL_SCRUB_LAG = 1;

export const SCROLL_PIN_HOST_SELECTOR = ".pin-stage-host";
export const SCROLL_PIN_HOST_ATTR = "data-preview-pin-host";

export function getScrollPinnedTargets(timeline: Timeline): AnimationTarget[] {
  return timeline.targets.filter((t) => t.scrollPin === true);
}

export function usesSplitScrollPin(timeline: Timeline): boolean {
  return (
    timeline.playbackType === "scroll" &&
    getScrollPinnedTargets(timeline).length > 0
  );
}

export function timelineUsesScrollPin(timeline: Timeline): boolean {
  return usesSplitScrollPin(timeline);
}

/** Export: pin intero trigger (contiene solo layer pinati). */
export function resolveScrollPinSelector(timeline: Timeline): boolean {
  return usesSplitScrollPin(timeline);
}

/** Con pin attivo GSAP consiglia start "top top" se si usa il default top center. */
export function scrollTriggerStartForPin(
  start: string | undefined,
  hasPin: boolean
): string {
  const s = start?.trim() || "top center";
  if (!hasPin) return s;
  if (s === "top center") return "top top";
  return s;
}

export type ScrollPinScrollTriggerExtras = {
  pin: true;
  pinType?: "transform";
  anticipatePin?: number;
};

/**
 * Pin dentro uno scroller (div overflow) richiede pinType transform:
 * position:fixed rispetto al viewport drifta mentre scrolli nel contenitore.
 */
export function scrollPinScrollTriggerExtras(
  timeline: Timeline,
  options?: { pinInsideScroller?: boolean }
): ScrollPinScrollTriggerExtras | Record<string, never> {
  if (!usesSplitScrollPin(timeline)) return {};
  if (options?.pinInsideScroller) {
    return {
      pin: true,
      pinType: "transform",
      anticipatePin: 1,
    };
  }
  return { pin: true };
}

export function scrollScrubValue(timeline: Timeline): boolean | number {
  return usesSplitScrollPin(timeline) ? true : SCROLL_SCRUB_LAG;
}

export function buildScrollTriggerVars(
  timeline: Timeline,
  trigger: Element | string,
  options?: {
    scroller?: Element | string;
    markers?: boolean;
    onUpdate?: (self: ScrollTrigger) => void;
  }
): ScrollTrigger.Vars {
  const hasPin = usesSplitScrollPin(timeline);
  const pinInsideScroller = Boolean(options?.scroller);
  return {
    trigger,
    ...(options?.scroller ? { scroller: options.scroller } : {}),
    start: scrollTriggerStartForPin(timeline.scrollTriggerStart, hasPin),
    end: resolveScrollEnd(timeline.scrollLength, timeline.scrollTriggerEnd),
    scrub: scrollScrubValue(timeline),
    invalidateOnRefresh: true,
    ...(options?.markers
      ? { markers: true, ...(pinInsideScroller ? { fixedMarkers: true } : {}) }
      : {}),
    ...(options?.onUpdate ? { onUpdate: options.onUpdate } : {}),
    ...scrollPinScrollTriggerExtras(timeline, { pinInsideScroller }),
  };
}

/** Righe per `scrollTrigger: { ... }` dentro `gsap.timeline({`. */
export function scrollTriggerTimelineCodeLines(
  timeline: Timeline,
  triggerSelector: string,
  options?: { scrollerSelector?: string; indent?: string }
): string[] {
  const hasPin = usesSplitScrollPin(timeline);
  const pinInsideScroller = Boolean(options?.scrollerSelector);
  const start = scrollTriggerStartForPin(timeline.scrollTriggerStart, hasPin);
  const end = resolveScrollEnd(timeline.scrollLength, timeline.scrollTriggerEnd);
  const scrub = scrollScrubValue(timeline);
  const ind = options?.indent ?? "  ";
  const inner = `${ind}  `;
  const lines: string[] = [];
  lines.push(`${ind}scrollTrigger: {`);
  lines.push(`${inner}trigger: "${triggerSelector}",`);
  if (options?.scrollerSelector) {
    lines.push(`${inner}scroller: "${options.scrollerSelector}",`);
  }
  lines.push(`${inner}start: "${start}",`);
  lines.push(`${inner}end: "${end}",`);
  lines.push(
    `${inner}scrub: ${typeof scrub === "boolean" ? scrub : scrub},`
  );
  lines.push(`${inner}invalidateOnRefresh: true,`);
  if (hasPin) {
    lines.push(`${inner}pin: true,`);
    if (pinInsideScroller) {
      lines.push(`${inner}pinType: "transform",`);
      lines.push(`${inner}anticipatePin: 1,`);
    }
  }
  lines.push(`${ind}},`);
  return lines;
}
