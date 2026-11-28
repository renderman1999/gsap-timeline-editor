import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import type { Keyframe, Timeline, Transform } from "@/stores/timeline-store";

export function registerGsapSvgPlugins(): void {
  gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin);
}

const SVG_PLUGIN_TYPES = new Set(["drawSvg", "morphSvg"]);

export function transformUsesSvgPlugin(transform: Transform): boolean {
  return SVG_PLUGIN_TYPES.has(transform.type);
}

export function targetHasSvgPluginKeyframes(
  targetId: string,
  keyframes: Keyframe[],
  initialStates?: Record<string, Transform[] | undefined>
): boolean {
  const inKf = keyframes.some(
    (k) =>
      k.targetId === targetId &&
      k.transforms.some((t) => transformUsesSvgPlugin(t))
  );
  const inInit = (initialStates?.[targetId] ?? []).some((t) =>
    transformUsesSvgPlugin(t)
  );
  return inKf || inInit;
}

export function timelineUsesDrawSvg(timeline: Timeline): boolean {
  const inKeyframes = timeline.keyframes.some((k) =>
    k.transforms.some((t) => t.type === "drawSvg")
  );
  const inInitial = Object.values(timeline.initialStates ?? {}).some((list) =>
    list?.some((t) => t.type === "drawSvg")
  );
  return inKeyframes || inInitial;
}

export function timelineUsesMorphSvg(timeline: Timeline): boolean {
  const inKeyframes = timeline.keyframes.some((k) =>
    k.transforms.some((t) => t.type === "morphSvg")
  );
  const inInitial = Object.values(timeline.initialStates ?? {}).some((list) =>
    list?.some((t) => t.type === "morphSvg")
  );
  return inKeyframes || inInitial;
}

export const DRAW_SVG_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/DrawSVGPlugin.min.js";
export const MORPH_SVG_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MorphSVGPlugin.min.js";

export const DRAW_SVG_PRESETS: { value: string; label: string }[] = [
  { value: "0% 100%", label: "Tratto completo" },
  { value: "0% 0%", label: "Nascosto" },
  { value: "20% 80%", label: "Segmento centrale" },
  { value: "0%", label: "Da zero" },
  { value: "100%", label: "Fine (100%)" },
];