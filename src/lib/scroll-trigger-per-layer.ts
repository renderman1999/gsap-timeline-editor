import type { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";
import { escapeJsString } from "@/lib/gsap-export-code";
import { resolveScrollEnd } from "@/lib/scroll-trigger-config";

function jsString(value: string): string {
  return `"${escapeJsString(value)}"`;
}
import {
  buildScrollTriggerVars,
  getScrollPinnedTargets,
  scrollScrubValue,
  scrollTriggerStartForPin,
} from "@/lib/gsap-scroll-pin";
import { timelineUsesScrollPinLayout } from "@/lib/fullpage-scroll";

export function targetUsesOwnScrollTrigger(target: AnimationTarget): boolean {
  return target.scrollTriggerOwn === true;
}

/** Timeline a orologio dentro un progetto scroll: niente scrub, parte con play(). */
export function targetUsesTimePlayback(target: AnimationTarget): boolean {
  return target.timePlayback === true;
}

export function timelineHasOwnScrollTriggerLayers(timeline: Timeline): boolean {
  return timeline.targets.some(targetUsesOwnScrollTrigger);
}

export function partitionTargetsByScrollTriggerMode(
  targets: AnimationTarget[]
): { shared: AnimationTarget[]; own: AnimationTarget[] } {
  const shared: AnimationTarget[] = [];
  const own: AnimationTarget[] = [];
  targets.forEach((t) => {
    if (targetUsesOwnScrollTrigger(t)) own.push(t);
    else shared.push(t);
  });
  return { shared, own };
}

/** Pin di sezione ha priorità: non va anche sulla timeline master. */
export function partitionScrollPlayback(targets: AnimationTarget[]): {
  timed: AnimationTarget[];
  pinned: AnimationTarget[];
  own: AnimationTarget[];
  shared: AnimationTarget[];
} {
  const timed: AnimationTarget[] = [];
  const pinned: AnimationTarget[] = [];
  const own: AnimationTarget[] = [];
  const shared: AnimationTarget[] = [];
  targets.forEach((t) => {
    if (targetUsesTimePlayback(t)) {
      timed.push(t);
      return;
    }
    if (t.scrollPin) {
      pinned.push(t);
      return;
    }
    if (targetUsesOwnScrollTrigger(t)) own.push(t);
    else shared.push(t);
  });
  return { timed, pinned, own, shared };
}

export function timePlaybackOptionLines(timeline: Timeline): string[] {
  const lines: string[] = [];
  if (timeline.loop) {
    lines.push("  repeat: -1,");
    if (timeline.yoyo) lines.push("  yoyo: true,");
  }
  return lines;
}

export function layerHasOwnScrollTimeline(target: AnimationTarget): boolean {
  return target.scrollPin === true || targetUsesOwnScrollTrigger(target);
}

export function resolveTargetScrollStart(
  timeline: Timeline,
  target: AnimationTarget
): string | undefined {
  return target.scrollTriggerStart?.trim() || timeline.scrollTriggerStart;
}

export function resolveTargetScrollEnd(
  timeline: Timeline,
  target: AnimationTarget
): string {
  const length =
    target.scrollTriggerScrollLength ?? timeline.scrollLength ?? 300;
  const end = target.scrollTriggerEnd?.trim() || timeline.scrollTriggerEnd;
  return resolveScrollEnd(length, end);
}

/** Master scroll (layer condivisi): se un solo layer è pinato, eredita il suo start/end. */
export function resolvePinnedMasterScrollTrigger(
  timeline: Timeline,
  fallbackTrigger: Element | string,
  resolveLayerEl: (targetId: string) => HTMLElement | null,
  scope: ParentNode | null | undefined,
  options?: { pinTriggerOnStage?: boolean }
): { trigger: Element | string; start: string; end: string } {
  const hasPin = timelineUsesScrollPinLayout(timeline);
  const pinned = getScrollPinnedTargets(timeline).filter(
    (t) => !targetUsesOwnScrollTrigger(t)
  );
  const stageTrigger =
    fallbackTrigger instanceof Element ? fallbackTrigger : fallbackTrigger;

  if (pinned.length === 1) {
    const p = pinned[0];
    const start = scrollTriggerStartForPin(
      resolveTargetScrollStart(timeline, p),
      hasPin
    );
    const end = resolveTargetScrollEnd(timeline, p);
    if (options?.pinTriggerOnStage) {
      return { trigger: stageTrigger, start, end };
    }
    const layerEl = resolveLayerEl(p.id);
    const trigger = resolveLayerScrollTriggerElement(
      scope,
      p,
      layerEl,
      fallbackTrigger
    );
    return { trigger, start, end };
  }
  return {
    trigger: fallbackTrigger,
    start: scrollTriggerStartForPin(timeline.scrollTriggerStart, hasPin),
    end: resolveScrollEnd(timeline.scrollLength, timeline.scrollTriggerEnd),
  };
}

export function resolveLayerScrollTriggerElement(
  scope: ParentNode | null | undefined,
  target: AnimationTarget,
  layerEl: HTMLElement | null,
  fallbackTrigger: Element | string
): Element | string {
  const sel = target.scrollTriggerSelector?.trim();
  if (sel && scope) {
    const found = scope.querySelector(sel);
    if (found) return found;
  }
  if (layerEl) return layerEl;
  return fallbackTrigger;
}

export function buildScrollTriggerVarsForTarget(
  timeline: Timeline,
  target: AnimationTarget,
  trigger: Element | string,
  options?: {
    scroller?: Element | string;
    markers?: boolean;
    onUpdate?: (self: ScrollTrigger) => void;
    refreshPriority?: number;
  }
): ScrollTrigger.Vars {
  const pinInsideScroller = Boolean(options?.scroller);
  const start = resolveTargetScrollStart(timeline, target)?.trim() || "top center";
  const end = resolveTargetScrollEnd(timeline, target);
  return {
    trigger,
    ...(options?.scroller ? { scroller: options.scroller } : {}),
    start,
    end,
    scrub: scrollScrubValue(timeline),
    invalidateOnRefresh: true,
    ...(options?.markers
      ? { markers: true, ...(pinInsideScroller ? { fixedMarkers: true } : {}) }
      : {}),
    ...(options?.onUpdate ? { onUpdate: options.onUpdate } : {}),
    refreshPriority: options?.refreshPriority ?? 0,
  };
}

/** Playhead editor: aggiorna da master o dalla timeline del layer attivo. */
export function shouldSyncScrollPlayhead(
  activeTargetId: string,
  targets: AnimationTarget[],
  scrollTimelineOwnerTargetId: string | null
): boolean {
  const active = targets.find((t) => t.id === activeTargetId);
  if (!active) return scrollTimelineOwnerTargetId === null;
  if (layerHasOwnScrollTimeline(active)) {
    return scrollTimelineOwnerTargetId === activeTargetId;
  }
  return scrollTimelineOwnerTargetId === null;
}

export function scrollTriggerTargetCodeLines(
  timeline: Timeline,
  target: AnimationTarget,
  triggerSelector: string,
  options?: { scrollerSelector?: string; indent?: string; refreshPriority?: number }
): string[] {
  const start = resolveTargetScrollStart(timeline, target)?.trim() || "top center";
  const end = resolveTargetScrollEnd(timeline, target);
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
  lines.push(`${inner}refreshPriority: ${options?.refreshPriority ?? 0},`);
  lines.push(`${ind}},`);
  return lines;
}

export function previewPinSectionSelector(target: AnimationTarget): string {
  const esc =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(target.id)
      : target.id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `[data-pin-section="${esc}"]`;
}

/** Sezione pin: il trigger è il pannello, i tween restano sul figlio. */
export function buildPinnedSectionScrollTriggerVars(
  timeline: Timeline,
  target: AnimationTarget,
  trigger: Element | string,
  options?: {
    scroller?: Element | string;
    markers?: boolean;
    onUpdate?: (self: ScrollTrigger) => void;
    refreshPriority?: number;
  }
): ScrollTrigger.Vars {
  const pinInsideScroller = Boolean(options?.scroller);
  const start = scrollTriggerStartForPin(
    resolveTargetScrollStart(timeline, target),
    true
  );
  const end = resolveTargetScrollEnd(timeline, target);
  return {
    trigger,
    ...(options?.scroller ? { scroller: options.scroller } : {}),
    start,
    end,
    scrub: true,
    invalidateOnRefresh: true,
    pin: true,
    pinSpacing: true,
    ...(pinInsideScroller
      ? { pinType: "transform" as const, anticipatePin: 1 }
      : {}),
    refreshPriority: options?.refreshPriority ?? 0,
    ...(options?.markers
      ? { markers: true, ...(pinInsideScroller ? { fixedMarkers: true } : {}) }
      : {}),
    ...(options?.onUpdate ? { onUpdate: options.onUpdate } : {}),
  };
}

export function scrollTriggerPinnedSectionCodeLines(
  timeline: Timeline,
  target: AnimationTarget,
  triggerSelector: string,
  options?: {
    scrollerSelector?: string;
    indent?: string;
    refreshPriority?: number;
  }
): string[] {
  const pinInsideScroller = Boolean(options?.scrollerSelector);
  const start = scrollTriggerStartForPin(
    resolveTargetScrollStart(timeline, target),
    true
  );
  const end = resolveTargetScrollEnd(timeline, target);
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
  lines.push(`${inner}scrub: true,`);
  lines.push(`${inner}invalidateOnRefresh: true,`);
  lines.push(`${inner}pin: true,`);
  lines.push(`${inner}pinSpacing: true,`);
  if (pinInsideScroller) {
    lines.push(`${inner}pinType: "transform",`);
    lines.push(`${inner}anticipatePin: 1,`);
  }
  lines.push(`${inner}refreshPriority: ${options?.refreshPriority ?? 0},`);
  lines.push(`${ind}},`);
  return lines;
}

export function previewLayerScrollTriggerSelector(
  target: AnimationTarget
): string {
  const custom = target.scrollTriggerSelector?.trim();
  if (custom) return custom;
  const esc =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(target.id)
      : target.id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `[data-preview-target="${esc}"]`;
}

/** ScrollTrigger globale della timeline (esportazione / layer condivisi). */
export { buildScrollTriggerVars };