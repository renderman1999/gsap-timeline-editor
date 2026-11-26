import type { Timeline } from "@/stores/timeline-store";

export const DEFAULT_BOUNDS_CLASS = "stage-bounds";

export const DEFAULT_GRADIENT_FROM = "rgba(26, 26, 46, 1)";
export const DEFAULT_GRADIENT_TO = "rgba(15, 52, 96, 1)";
export const DEFAULT_GRADIENT_ANGLE = 135;

/** Solo lettere, numeri, trattino, underscore. */
export function normalizeBoundsClass(raw?: string): string {
  const trimmed = raw?.trim().replace(/^\./, "") ?? "";
  if (!trimmed) return DEFAULT_BOUNDS_CLASS;
  const safe = trimmed.replace(/[^\w-]/g, "");
  return safe || DEFAULT_BOUNDS_CLASS;
}

export function boundsClassSelector(timeline: Pick<Timeline, "boundsClass">): string {
  return `.${normalizeBoundsClass(timeline.boundsClass)}`;
}

export function buildLinearGradientCss(
  from?: string,
  to?: string,
  angle = DEFAULT_GRADIENT_ANGLE
): string | undefined {
  const start = from?.trim();
  const end = to?.trim();
  if (!start || !end) return undefined;
  const deg = Number.isFinite(angle) ? angle : DEFAULT_GRADIENT_ANGLE;
  return `linear-gradient(${deg}deg, ${start} 0%, ${end} 100%)`;
}

export function timelineHasGradientStops(
  timeline: Pick<
    Timeline,
    "previewGradientFrom" | "previewGradientTo" | "previewBackgroundGradient"
  >
): boolean {
  if (timeline.previewGradientFrom?.trim() && timeline.previewGradientTo?.trim()) {
    return true;
  }
  return !!timeline.previewBackgroundGradient?.trim();
}

export function resolveTimelineBackground(
  timeline: Pick<
    Timeline,
    | "previewBackground"
    | "previewBackgroundGradient"
    | "previewGradientFrom"
    | "previewGradientTo"
    | "previewGradientAngle"
  >
): string | undefined {
  const fromStops = buildLinearGradientCss(
    timeline.previewGradientFrom,
    timeline.previewGradientTo,
    timeline.previewGradientAngle ?? DEFAULT_GRADIENT_ANGLE
  );
  if (fromStops) return fromStops;

  const gradient = timeline.previewBackgroundGradient?.trim();
  if (gradient) return gradient;

  const solid = timeline.previewBackground?.trim();
  if (solid) return solid;
  return undefined;
}

export function sanitizeStoredDraggableBounds(
  bounds?: string
): string | undefined {
  const t = bounds?.trim();
  if (!t || t === "." || t === "#") return undefined;
  return t;
}