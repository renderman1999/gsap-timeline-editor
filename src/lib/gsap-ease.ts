import { gsap } from "gsap";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";
import { ExpoScaleEase, RoughEase, SlowMo } from "gsap/EasePack";
import type { Keyframe, Timeline } from "@/stores/timeline-store";

let easePluginsRegistered = false;

export function registerEasePlugins(): void {
  if (easePluginsRegistered) return;
  gsap.registerPlugin(
    CustomEase,
    CustomWiggle,
    CustomBounce,
    RoughEase,
    SlowMo,
    ExpoScaleEase
  );
  easePluginsRegistered = true;
}

export function easeInstanceId(keyframe: Pick<Keyframe, "id">): string {
  const safe = keyframe.id.replace(/[^a-zA-Z0-9_]/g, "_");
  return `ease_${safe}`;
}

function num(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function resolveEase(keyframe: Keyframe): string {
  const extra = keyframe.easeExtra;
  const plugin = extra?.plugin;
  if (plugin === "steps") {
    return `steps(${Math.max(1, Math.round(num(extra?.steps, 5)))})`;
  }
  if (plugin === "rough") {
    const taper = extra?.taper ?? "none";
    const randomize = extra?.randomize !== false;
    const clamp = Boolean(extra?.clamp);
    return `rough({ strength: ${num(extra?.strength, 1)}, points: ${Math.round(num(extra?.points, 20))}, taper: "${taper}", randomize: ${randomize}, clamp: ${clamp} })`;
  }
  if (plugin === "slow") {
    return `slow(${num(extra?.linearRatio, 0.7)}, ${num(extra?.power, 0.7)}, ${Boolean(extra?.yoyoMode)})`;
  }
  if (plugin === "expoScale") {
    return `expoScale(${num(extra?.expoStart, 1)}, ${num(extra?.expoEnd, 2)}, none)`;
  }
  if (plugin === "custom") {
    if (!extra?.curve?.trim()) return keyframe.easing || "power2.out";
    return easeInstanceId(keyframe);
  }
  if (plugin === "wiggle" || plugin === "customBounce") {
    return easeInstanceId(keyframe);
  }

  const base = (keyframe.easing || "power2.out").replace(/\(.*\)$/, "");
  if (base.startsWith("back") && extra?.param != null) {
    const name = base.includes(".") ? base : "back.out";
    return `${name}(${extra.param})`;
  }
  if (base.startsWith("elastic") && (extra?.param != null || extra?.param2 != null)) {
    const name = base.includes(".") ? base : "elastic.out";
    return `${name}(${extra?.param ?? 1}, ${extra?.param2 ?? 0.3})`;
  }
  return base;
}

export function registerKeyframeEases(keyframes: Keyframe[]): void {
  registerEasePlugins();
  keyframes.forEach((keyframe) => {
    const extra = keyframe.easeExtra;
    if (!extra?.plugin) return;
    const id = easeInstanceId(keyframe);
    if (extra.plugin === "custom" && extra.curve?.trim()) {
      CustomEase.create(id, extra.curve.trim());
    }
    if (extra.plugin === "wiggle") {
      CustomWiggle.create(id, {
        wiggles: Math.max(1, Math.round(num(extra.wiggles, 6))),
        type: extra.wiggleType ?? "easeOut",
      });
    }
    if (extra.plugin === "customBounce") {
      CustomBounce.create(id, {
        strength: num(extra.strength, 0.7),
        squash: num(extra.squash, 1),
        endAtStart: Boolean(extra.endAtStart),
      });
    }
  });
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function keyframeEaseCodeLines(keyframes: Keyframe[]): string[] {
  const lines: string[] = [];
  keyframes.forEach((keyframe) => {
    const extra = keyframe.easeExtra;
    if (!extra?.plugin) return;
    const id = easeInstanceId(keyframe);
    if (extra.plugin === "custom" && extra.curve?.trim()) {
      lines.push(`CustomEase.create(${quote(id)}, ${quote(extra.curve.trim())});`);
    }
    if (extra.plugin === "wiggle") {
      lines.push(
        `CustomWiggle.create(${quote(id)}, { wiggles: ${Math.max(1, Math.round(num(extra.wiggles, 6)))}, type: ${quote(extra.wiggleType ?? "easeOut")} });`
      );
    }
    if (extra.plugin === "customBounce") {
      lines.push(
        `CustomBounce.create(${quote(id)}, { strength: ${num(extra.strength, 0.7)}, squash: ${num(extra.squash, 1)}, endAtStart: ${Boolean(extra.endAtStart)} });`
      );
    }
  });
  return lines;
}

export function timelineUsesEasePlugin(
  timeline: Timeline,
  kind: "easePack" | "customEase" | "customWiggle" | "customBounce"
): boolean {
  return timeline.keyframes.some((keyframe) => {
    const plugin = keyframe.easeExtra?.plugin;
    if (!plugin) return false;
    if (kind === "easePack") {
      return plugin === "rough" || plugin === "slow" || plugin === "expoScale";
    }
    if (kind === "customEase") {
      return (
        plugin === "custom" || plugin === "wiggle" || plugin === "customBounce"
      );
    }
    if (kind === "customWiggle") return plugin === "wiggle";
    return plugin === "customBounce";
  });
}
