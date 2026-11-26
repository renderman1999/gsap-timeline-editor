import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";
import type { TextSplitMode } from "@/stores/timeline-store";

export const SPLIT_TEXT_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js";

export function registerSplitTextPlugin(): void {
  gsap.registerPlugin(SplitText);
}

export function isActiveTextSplit(mode?: TextSplitMode): boolean {
  return !!mode && mode !== "none";
}

export function splitPropertyForMode(mode: TextSplitMode): "chars" | "words" | "lines" {
  if (mode === "words") return "words";
  if (mode === "lines") return "lines";
  return "chars";
}

export function splitTextVarName(targetId: string): string {
  return `split_${targetId.replace(/\W/g, "").slice(0, 10)}`;
}

export function splitTweenTargetRef(target: AnimationTarget): string | null {
  if (target.type !== "text" || !isActiveTextSplit(target.textSplit)) {
    return null;
  }
  const varName = splitTextVarName(target.id);
  const prop = splitPropertyForMode(target.textSplit!);
  return `${varName}.${prop}`;
}

export function timelineUsesSplitText(timeline: Timeline): boolean {
  return timeline.targets.some((t) => isActiveTextSplit(t.textSplit));
}

export function splitTextCreateCode(target: AnimationTarget): string[] {
  if (target.type !== "text" || !isActiveTextSplit(target.textSplit)) {
    return [];
  }
  const varName = splitTextVarName(target.id);
  const selector = target.selector.trim();
  const type = target.textSplit === "lines" ? "lines" : target.textSplit;
  return [
    `let ${varName} = SplitText.create("${selector.replace(/"/g, '\\"')}", { type: "${type}" });`,
  ];
}

export function resolvePreviewTextElement(
  wrapper: HTMLElement
): HTMLElement | null {
  const tagged = wrapper.querySelector<HTMLElement>("[data-text-layer]");
  if (tagged) return tagged;
  return wrapper.querySelector("p, h1, h2, h3, span");
}

export function createSplitTextForPreview(
  textEl: HTMLElement,
  mode: TextSplitMode
): SplitText | null {
  if (!isActiveTextSplit(mode)) return null;
  const type =
    mode === "chars" ? "chars" : mode === "words" ? "words" : "lines";
  return SplitText.create(textEl, {
    type,
    aria: "auto",
  });
}

export function splitTweenTarget(
  split: SplitText,
  mode: TextSplitMode
): Element[] {
  const prop = splitPropertyForMode(mode);
  const nodes = split[prop];
  return Array.isArray(nodes) ? nodes : [...nodes];
}