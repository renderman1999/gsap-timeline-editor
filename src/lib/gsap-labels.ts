import type { TimelineLabel } from "@/stores/timeline-store";

const LABEL_NAME = /^[A-Za-z_][\w-]*$/;

export function sanitizeTimelineLabelName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, "_");
  if (!LABEL_NAME.test(trimmed)) return "";
  return trimmed;
}

export function normalizeTimelineLabels(
  labels: TimelineLabel[] | undefined
): TimelineLabel[] | undefined {
  if (!labels?.length) return undefined;
  const seen = new Set<string>();
  const next: TimelineLabel[] = [];
  labels.forEach((label) => {
    const name = sanitizeTimelineLabelName(label.name);
    const time = Number(label.time);
    if (!name || !Number.isFinite(time) || time < 0 || seen.has(name)) return;
    seen.add(name);
    next.push({
      id: label.id || name,
      name,
      time: Math.round(time * 1000) / 1000,
    });
  });
  return next.length > 0 ? next : undefined;
}

/** Tempo in secondi se position è un nome label, o "nome+=0.3" / "nome-=0.2". */
export function resolveLabelPositionTime(
  position: string | undefined,
  labels: TimelineLabel[] | undefined
): number | undefined {
  const raw = position?.trim();
  if (!raw || !labels?.length) return undefined;
  const exact = labels.find((label) => label.name === raw);
  if (exact) return exact.time;
  const match = raw.match(/^([A-Za-z_][\w-]*)\s*(\+=|-=)\s*(\d+(?:\.\d+)?)$/);
  if (!match) return undefined;
  const base = labels.find((label) => label.name === match[1]);
  if (!base) return undefined;
  const delta = Number(match[3]);
  if (!Number.isFinite(delta)) return undefined;
  return match[2] === "+="
    ? base.time + delta
    : Math.max(0, base.time - delta);
}

export function addLabelsToTimeline(
  tl: { addLabel: (name: string, time: number) => unknown },
  labels: TimelineLabel[] | undefined
): void {
  labels?.forEach((label) => {
    tl.addLabel(label.name, label.time);
  });
}

export function timelineLabelCodeLines(
  timelineVar: string,
  labels: TimelineLabel[] | undefined
): string[] {
  return (labels ?? []).map((label) => {
    const name = label.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${timelineVar}.addLabel("${name}", ${label.time});`;
  });
}
