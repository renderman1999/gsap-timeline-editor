export type ScrollEdge = "top" | "center" | "bottom";

export interface ParsedScrollStart {
  trigger: ScrollEdge;
  viewport: ScrollEdge | number;
}

const EDGE_SET: ScrollEdge[] = ["top", "center", "bottom"];

export function parseScrollStart(start: string | undefined): ParsedScrollStart {
  const fallback: ParsedScrollStart = { trigger: "top", viewport: "center" };
  if (!start?.trim()) return fallback;

  const parts = start.trim().split(/\s+/);
  if (parts.length < 2) return fallback;

  const trigger = EDGE_SET.includes(parts[0] as ScrollEdge)
    ? (parts[0] as ScrollEdge)
    : "top";

  const vp = parts[1];
  if (vp.endsWith("%")) {
    const n = parseFloat(vp);
    if (Number.isFinite(n)) {
      return { trigger, viewport: Math.min(100, Math.max(0, n)) };
    }
  }

  if (EDGE_SET.includes(vp as ScrollEdge)) {
    return { trigger, viewport: vp as ScrollEdge };
  }

  return fallback;
}

export function formatScrollStart(
  trigger: ScrollEdge,
  viewport: ScrollEdge | number
): string {
  if (typeof viewport === "number") {
    return `${trigger} ${Math.round(viewport)}%`;
  }
  return `${trigger} ${viewport}`;
}

export function viewportEdgeToPercent(viewport: ScrollEdge | number): number {
  if (typeof viewport === "number") return viewport;
  switch (viewport) {
    case "top":
      return 0;
    case "bottom":
      return 100;
    default:
      return 50;
  }
}

export function viewportPercentToEdge(percent: number): ScrollEdge | number {
  if (percent <= 5) return "top";
  if (percent >= 95) return "bottom";
  if (percent >= 45 && percent <= 55) return "center";
  return Math.round(percent);
}

export type ScrollEndMode = "relative" | "absolute";

export function parseScrollPosition(
  position: string | undefined
): ParsedScrollStart {
  return parseScrollStart(position);
}

export function isRelativeScrollEnd(end: string | undefined): boolean {
  const trimmed = end?.trim();
  if (!trimmed) return true;
  return /^[+-]=/.test(trimmed);
}

export function inferScrollEndMode(
  scrollTriggerEnd: string | undefined,
  explicit?: ScrollEndMode
): ScrollEndMode {
  if (explicit) return explicit;
  if (scrollTriggerEnd?.trim() && !isRelativeScrollEnd(scrollTriggerEnd)) {
    return "absolute";
  }
  return "relative";
}

export function resolveScrollEnd(
  scrollLength: number | undefined,
  scrollTriggerEnd?: string
): string {
  const custom = scrollTriggerEnd?.trim();
  if (custom) return custom;
  return `+=${scrollLength ?? 300}%`;
}

export const DEFAULT_ABSOLUTE_SCROLL_END = "bottom top";

export function triggerEdgeOffset(
  edge: ScrollEdge,
  triggerHeight: number
): number {
  switch (edge) {
    case "top":
      return 0;
    case "bottom":
      return triggerHeight;
    default:
      return triggerHeight / 2;
  }
}