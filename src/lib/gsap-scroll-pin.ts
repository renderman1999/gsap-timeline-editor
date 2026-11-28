import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";
import { escapeJsString } from "@/lib/gsap-export-code";
import { resolveScrollEnd } from "@/lib/scroll-trigger-config";
import {
  timelineUsesScrollPinLayout,
  usesSplitScrollPin,
} from "@/lib/fullpage-scroll";

export { usesSplitScrollPin };

function jsString(value: string): string {
  return `"${escapeJsString(value)}"`;
}

/** Stesso ritardo dell'esempio GSAP (`scrub: 1`). */
export const SCROLL_SCRUB_LAG = 1;

export const SCROLL_PIN_HOST_SELECTOR = ".pin-stage-host";
export const SCROLL_PIN_HOST_ATTR = "data-preview-pin-host";

/** Rimuove pin/spacer ScrollTrigger prima di rebuild anteprima scroll. */
export function killAllPreviewScrollTriggers(revert = true): void {
  if (typeof window === "undefined") return;
  ScrollTrigger.getAll().forEach((st) => st.kill(revert));
}

export function getScrollPinnedTargets(timeline: Timeline): AnimationTarget[] {
  return timeline.targets.filter(
    (t) => t.scrollPin === true && t.timePlayback !== true
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

export function scrollScrubValue(timeline: Timeline): boolean | number {
  return timelineUsesScrollPinLayout(timeline) ? true : SCROLL_SCRUB_LAG;
}

export function buildScrollTriggerVars(
  timeline: Timeline,
  trigger: Element | string,
  options?: {
    scroller?: Element | string;
    markers?: boolean;
    onUpdate?: (self: ScrollTrigger) => void;
    start?: string;
    end?: string;
    refreshPriority?: number;
  }
): ScrollTrigger.Vars {
  const pinInsideScroller = Boolean(options?.scroller);
  const startRaw = options?.start ?? timeline.scrollTriggerStart;
  const endRaw =
    options?.end ??
    resolveScrollEnd(timeline.scrollLength, timeline.scrollTriggerEnd);
  return {
    trigger,
    ...(options?.scroller ? { scroller: options.scroller } : {}),
    start: startRaw?.trim() || "top center",
    end: endRaw,
    scrub: scrollScrubValue(timeline),
    invalidateOnRefresh: true,
    ...(options?.markers
      ? { markers: true, ...(pinInsideScroller ? { fixedMarkers: true } : {}) }
      : {}),
    ...(options?.onUpdate ? { onUpdate: options.onUpdate } : {}),
    ...(options?.refreshPriority != null
      ? { refreshPriority: options.refreshPriority }
      : {}),
  };
}

/** Righe per `scrollTrigger: { ... }` dentro `gsap.timeline({`. */
export function scrollTriggerTimelineCodeLines(
  timeline: Timeline,
  triggerSelector: string,
  options?: { scrollerSelector?: string; indent?: string; refreshPriority?: number }
): string[] {
  const start = timeline.scrollTriggerStart?.trim() || "top center";
  const end = resolveScrollEnd(timeline.scrollLength, timeline.scrollTriggerEnd);
  const scrub = scrollScrubValue(timeline);
  const ind = options?.indent ?? "  ";
  const inner = `${ind}  `;
  const lines: string[] = [];
  lines.push(`${ind}scrollTrigger: {`);
  lines.push(`${inner}trigger: ${jsString(triggerSelector)},`);
  if (options?.scrollerSelector) {
    lines.push(`${inner}scroller: ${jsString(options.scrollerSelector)},`);
  }
  lines.push(`${inner}start: ${jsString(start)},`);
  lines.push(`${inner}end: ${jsString(end)},`);
  lines.push(
    `${inner}scrub: ${typeof scrub === "boolean" ? scrub : scrub},`
  );
  lines.push(`${inner}invalidateOnRefresh: true,`);
  if (options?.refreshPriority != null) {
    lines.push(`${inner}refreshPriority: ${options.refreshPriority},`);
  }
  lines.push(`${ind}},`);
  return lines;
}
