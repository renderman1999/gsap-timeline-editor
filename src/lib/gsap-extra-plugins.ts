import type { Timeline, TransformType } from "@/stores/timeline-store";
import { timelineUsesEasePlugin } from "@/lib/gsap-ease";

const GSAP_CDN_VERSION = "3.13.0";

function cdn(file: string): string {
  return `https://cdn.jsdelivr.net/npm/gsap@${GSAP_CDN_VERSION}/dist/${file}`;
}

export const EASE_PACK_CDN = cdn("EasePack.min.js");
export const CUSTOM_EASE_CDN = cdn("CustomEase.min.js");
export const CUSTOM_WIGGLE_CDN = cdn("CustomWiggle.min.js");
export const CUSTOM_BOUNCE_CDN = cdn("CustomBounce.min.js");
export const FLIP_CDN = cdn("Flip.min.js");
export const SCRAMBLE_TEXT_CDN = cdn("ScrambleTextPlugin.min.js");
export const PHYSICS_2D_CDN = cdn("Physics2DPlugin.min.js");
export const PHYSICS_PROPS_CDN = cdn("PhysicsPropsPlugin.min.js");
export const SCROLL_TO_CDN = cdn("ScrollToPlugin.min.js");

function hasTransform(timeline: Timeline, type: TransformType): boolean {
  return timeline.keyframes.some((keyframe) =>
    keyframe.transforms.some((transform) => transform.type === type)
  );
}

export function timelineUsesFlip(timeline: Timeline): boolean {
  return hasTransform(timeline, "flip");
}

export function timelineUsesScrambleText(timeline: Timeline): boolean {
  return hasTransform(timeline, "scrambleText");
}

export function timelineUsesPhysics2D(timeline: Timeline): boolean {
  return hasTransform(timeline, "physics2D");
}

export function timelineUsesPhysicsProps(timeline: Timeline): boolean {
  return hasTransform(timeline, "physicsProps");
}

export function timelineUsesScrollTo(timeline: Timeline): boolean {
  return hasTransform(timeline, "scrollTo");
}

export function extraPluginRegisterLines(timeline: Timeline): string[] {
  const lines: string[] = [];
  const push = (globalName: string) => {
    lines.push(
      `if (typeof ${globalName} !== "undefined") { gsap.registerPlugin(${globalName}); }`
    );
  };
  if (timelineUsesEasePlugin(timeline, "easePack")) {
    push("RoughEase");
    push("SlowMo");
    push("ExpoScaleEase");
  }
  if (timelineUsesEasePlugin(timeline, "customEase")) push("CustomEase");
  if (timelineUsesEasePlugin(timeline, "customWiggle")) push("CustomWiggle");
  if (timelineUsesEasePlugin(timeline, "customBounce")) push("CustomBounce");
  if (timelineUsesFlip(timeline)) push("Flip");
  if (timelineUsesScrambleText(timeline)) push("ScrambleTextPlugin");
  if (timelineUsesPhysics2D(timeline)) push("Physics2DPlugin");
  if (timelineUsesPhysicsProps(timeline)) push("PhysicsPropsPlugin");
  if (timelineUsesScrollTo(timeline)) push("ScrollToPlugin");
  return lines;
}

export function extraPluginImportLines(timeline: Timeline): string[] {
  const lines: string[] = [];
  if (timelineUsesEasePlugin(timeline, "easePack")) {
    lines.push(
      `import { RoughEase, SlowMo, ExpoScaleEase } from "gsap/EasePack";`
    );
  }
  if (timelineUsesEasePlugin(timeline, "customEase")) {
    lines.push(`import { CustomEase } from "gsap/CustomEase";`);
  }
  if (timelineUsesEasePlugin(timeline, "customWiggle")) {
    lines.push(`import { CustomWiggle } from "gsap/CustomWiggle";`);
  }
  if (timelineUsesEasePlugin(timeline, "customBounce")) {
    lines.push(`import { CustomBounce } from "gsap/CustomBounce";`);
  }
  if (timelineUsesFlip(timeline)) lines.push(`import { Flip } from "gsap/Flip";`);
  if (timelineUsesScrambleText(timeline)) {
    lines.push(`import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";`);
  }
  if (timelineUsesPhysics2D(timeline)) {
    lines.push(`import { Physics2DPlugin } from "gsap/Physics2DPlugin";`);
  }
  if (timelineUsesPhysicsProps(timeline)) {
    lines.push(`import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";`);
  }
  if (timelineUsesScrollTo(timeline)) {
    lines.push(`import { ScrollToPlugin } from "gsap/ScrollToPlugin";`);
  }
  return lines;
}

export function extraPluginModuleRegisterLines(timeline: Timeline): string[] {
  const names: string[] = [];
  if (timelineUsesEasePlugin(timeline, "easePack")) {
    names.push("RoughEase", "SlowMo", "ExpoScaleEase");
  }
  if (timelineUsesEasePlugin(timeline, "customEase")) names.push("CustomEase");
  if (timelineUsesEasePlugin(timeline, "customWiggle")) names.push("CustomWiggle");
  if (timelineUsesEasePlugin(timeline, "customBounce")) names.push("CustomBounce");
  if (timelineUsesFlip(timeline)) names.push("Flip");
  if (timelineUsesScrambleText(timeline)) names.push("ScrambleTextPlugin");
  if (timelineUsesPhysics2D(timeline)) names.push("Physics2DPlugin");
  if (timelineUsesPhysicsProps(timeline)) names.push("PhysicsPropsPlugin");
  if (timelineUsesScrollTo(timeline)) names.push("ScrollToPlugin");
  if (names.length === 0) return [];
  return [`gsap.registerPlugin(${names.join(", ")});`];
}
