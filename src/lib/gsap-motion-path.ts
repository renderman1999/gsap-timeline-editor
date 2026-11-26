import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import type { Keyframe, Timeline, Transform } from "@/stores/timeline-store";

export const MOTION_PATH_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MotionPathPlugin.min.js";

export const DEFAULT_MOTION_PATH_SELECTOR = "#motion-path";

/** Curva di esempio (viewBox 0 0 500 300). */
export const DEFAULT_MOTION_PATH_D =
  "M 40,220 Q 150,40 260,180 T 460,120";

export const MOTION_PATH_TRANSFORM_ORIGIN = "50% 50%";

export type MotionPathGsapConfig = {
  path: string;
  autoRotate?: boolean;
  align?: string;
  alignOrigin?: [number, number];
  start?: number;
  end?: number;
};

export function registerMotionPathPlugin(): void {
  gsap.registerPlugin(MotionPathPlugin);
}

export function transformUsesMotionPath(transform: Transform): boolean {
  return transform.type === "motionPath";
}

function scanTransforms(
  transforms: Transform[],
  fn: (t: Transform) => void
): void {
  transforms.forEach(fn);
}

export function timelineUsesMotionPath(timeline: Timeline): boolean {
  const inKeyframes = timeline.keyframes.some((k) =>
    k.transforms.some((t) => transformUsesMotionPath(t))
  );
  const inInitial = Object.values(timeline.initialStates ?? {}).some((list) =>
    list?.some((t) => transformUsesMotionPath(t))
  );
  return inKeyframes || inInitial;
}

export function parseAlignOrigin(
  raw: string | number | undefined
): [number, number] | undefined {
  if (raw == null || raw === "") return undefined;
  const parts = String(raw)
    .split(/[, ]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n));
  if (parts.length >= 2) {
    return [parts[0], parts[1]];
  }
  return undefined;
}

export function buildMotionPathGsapConfig(
  values: Record<string, number | string>
): MotionPathGsapConfig | null {
  const path = String(values.path ?? "").trim();
  if (!path) return null;

  const config: MotionPathGsapConfig = { path };

  const autoRotate = values.autoRotate;
  if (autoRotate === 1 || autoRotate === "1") {
    config.autoRotate = true;
  }

  const align = String(values.align ?? "").trim();
  if (align) {
    config.align = align;
  }

  const alignOrigin = parseAlignOrigin(values.alignOrigin);
  if (alignOrigin) {
    config.alignOrigin = alignOrigin;
  }

  const start = values.start;
  if (start !== undefined && start !== "" && !Number.isNaN(Number(start))) {
    const n = Number(start);
    if (n >= 0 && n <= 1) config.start = n;
  }

  const end = values.end;
  if (end !== undefined && end !== "" && !Number.isNaN(Number(end))) {
    const n = Number(end);
    if (n >= 0 && n <= 1) config.end = n;
  }

  return config;
}

export function applyMotionPathTransformToProps(
  props: Record<string, unknown>,
  values: Record<string, number | string>
): void {
  const config = buildMotionPathGsapConfig(values);
  if (!config) return;
  props.motionPath = config;
  props.transformOrigin = MOTION_PATH_TRANSFORM_ORIGIN;
}

export function collectMotionPathGuideIds(timeline: Timeline): string[] {
  const ids = new Set<string>();

  const considerPath = (path: string) => {
    const trimmed = path.trim();
    if (trimmed.startsWith("#")) {
      ids.add(trimmed.slice(1));
    }
  };

  const scan = (transforms: Transform[]) => {
    scanTransforms(transforms, (t) => {
      if (t.type !== "motionPath") return;
      considerPath(String(t.values.path ?? ""));
    });
  };

  timeline.keyframes.forEach((k) => scan(k.transforms));
  Object.values(timeline.initialStates ?? {}).forEach((list) => {
    if (list) scan(list);
  });

  if (ids.size === 0 && timelineUsesMotionPath(timeline)) {
    ids.add(DEFAULT_MOTION_PATH_SELECTOR.slice(1));
  }

  return [...ids];
}

export function motionPathGuideSvgMarkup(
  ids: string[],
  options?: { visibleStroke?: boolean }
): string {
  const visible = options?.visibleStroke ?? false;
  const stroke = visible
    ? 'stroke="rgba(255,255,255,0.25)" stroke-width="2"'
    : 'stroke="none"';

  const paths = ids
    .map((id) => {
      const d =
        id === DEFAULT_MOTION_PATH_SELECTOR.slice(1)
          ? DEFAULT_MOTION_PATH_D
          : DEFAULT_MOTION_PATH_D;
      return `<path id="${id}" d="${d}" fill="none" ${stroke} vector-effect="non-scaling-stroke" />`;
    })
    .join("\n      ");

  return `<svg class="motion-path-guides" aria-hidden="true" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible">\n      ${paths}\n    </svg>`;
}

export function resolveMotionPathElement(
  scope: Element | null,
  pathRef: string
): Element | null {
  if (!scope || !pathRef.trim()) return null;
  const trimmed = pathRef.trim();
  if (trimmed.startsWith("#")) {
    const id = trimmed.slice(1);
    const inScope = scope.querySelector(`#${CSS.escape(id)}`);
    if (inScope) return inScope;
    return document.getElementById(id);
  }
  if (trimmed.startsWith(".")) {
    return scope.querySelector(trimmed) ?? document.querySelector(trimmed);
  }
  return scope.querySelector(trimmed) ?? document.querySelector(trimmed);
}

export function motionPathConfigToCode(config: MotionPathGsapConfig): string {
  const parts: string[] = [];
  const path = config.path;
  if (path.startsWith("M") || path.startsWith("m")) {
    parts.push(`path: "${escapeJsString(path)}"`);
  } else {
    parts.push(`path: "${escapeJsString(path)}"`);
  }
  if (config.autoRotate) {
    parts.push("autoRotate: true");
  }
  if (config.align) {
    parts.push(`align: "${escapeJsString(config.align)}"`);
  }
  if (config.alignOrigin) {
    parts.push(
      `alignOrigin: [${config.alignOrigin[0]}, ${config.alignOrigin[1]}]`
    );
  }
  if (config.start != null) {
    parts.push(`start: ${config.start}`);
  }
  if (config.end != null) {
    parts.push(`end: ${config.end}`);
  }
  return `{ ${parts.join(", ")} }`;
}

function escapeJsString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function keyframeHasMotionPath(keyframes: Keyframe[], targetId: string): boolean {
  return keyframes.some(
    (k) =>
      k.targetId === targetId &&
      k.transforms.some((t) => transformUsesMotionPath(t))
  );
}