import type { Keyframe, KeyframeStagger } from "@/stores/timeline-store";
import {
  compileFunction,
  formatCodeValue,
  isFunctionSource,
} from "@/lib/gsap-value";

export interface FlipStepConfig {
  absolute: boolean;
  nested: boolean;
  scale: boolean;
  simple: boolean;
  toggleClass?: string;
}

export interface ScrollToStepConfig {
  target: string;
  vars: Record<string, number | string>;
}

const CALLBACK_KEYS = [
  "onStart",
  "onUpdate",
  "onComplete",
  "onRepeat",
  "onReverseComplete",
] as const;

export type CallbackKey = (typeof CALLBACK_KEYS)[number];

export function resolvePosition(keyframe: Keyframe): number | string {
  const raw = keyframe.position?.trim();
  if (raw) return raw;
  return keyframe.delay;
}

function staggerConfigActive(config: KeyframeStagger | undefined): boolean {
  if (!config) return false;
  return Boolean(
    (config.amount != null && config.amount > 0) ||
      config.from ||
      config.grid?.trim() ||
      config.axis ||
      config.ease?.trim()
  );
}

export function resolveStagger(
  keyframe: Keyframe
): number | Record<string, unknown> | undefined {
  const each =
    keyframe.stagger != null && keyframe.stagger > 0
      ? keyframe.stagger
      : undefined;
  const config = keyframe.staggerConfig;
  if (!staggerConfigActive(config)) return each;

  const obj: Record<string, unknown> = {};
  if (each != null) obj.each = each;
  if (config?.amount != null && config.amount > 0) obj.amount = config.amount;
  if (config?.from) obj.from = config.from;
  const grid = config?.grid?.trim();
  if (grid === "auto") obj.grid = "auto";
  else if (grid) {
    const match = grid.match(/^(\d+)\s*,\s*(\d+)$/);
    if (match) obj.grid = [Number(match[1]), Number(match[2])];
  }
  if (config?.axis) obj.axis = config.axis;
  if (config?.ease?.trim()) obj.ease = config.ease.trim();
  return Object.keys(obj).length > 0 ? obj : each;
}

export function parseStartAt(
  source: string | undefined
): Record<string, number | string> | undefined {
  const raw = source?.trim();
  if (!raw) return undefined;
  const out: Record<string, number | string> = {};
  raw.split(",").forEach((part) => {
    const index = part.indexOf(":");
    if (index <= 0) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!/^[A-Za-z_][\w]*$/.test(key) || !value) return;
    if (/^-?\d+(\.\d+)?$/.test(value)) out[key] = Number(value);
    else out[key] = value.replace(/^["']|["']$/g, "");
  });
  return Object.keys(out).length > 0 ? out : undefined;
}

export function readFlip(keyframe: Keyframe): FlipStepConfig | undefined {
  const transform = keyframe.transforms.find((item) => item.type === "flip");
  if (!transform) return undefined;
  const toggle = String(transform.values.toggleClass ?? "").trim();
  return {
    absolute: transform.values.absolute === 1 || transform.values.absolute === "1",
    nested: transform.values.nested === 1 || transform.values.nested === "1",
    scale: !(transform.values.scale === 0 || transform.values.scale === "0"),
    simple: transform.values.simple === 1 || transform.values.simple === "1",
    ...(toggle ? { toggleClass: toggle } : {}),
  };
}

export function readScrollTo(keyframe: Keyframe): ScrollToStepConfig | undefined {
  const transform = keyframe.transforms.find((item) => item.type === "scrollTo");
  if (!transform) return undefined;
  const vars: Record<string, number | string> = {};
  (["x", "y", "offsetX", "offsetY"] as const).forEach((key) => {
    const value = transform.values[key];
    if (value == null || value === "") return;
    if (typeof value === "number" && Number.isFinite(value)) vars[key] = value;
    else if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();
      vars[key] = /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : trimmed;
    }
  });
  if (Object.keys(vars).length === 0) vars.y = 0;
  const target = String(transform.values.scrollTarget ?? "window").trim() || "window";
  return { target, vars };
}

function overwriteValue(
  mode: Keyframe["overwrite"]
): boolean | "auto" | undefined {
  if (mode === "true") return true;
  if (mode === "false") return false;
  if (mode === "auto") return "auto";
  return undefined;
}

export function runtimeTweenControls(
  keyframe: Pick<
    Keyframe,
    | "repeat"
    | "yoyo"
    | "repeatDelay"
    | "yoyoEase"
    | "overwrite"
    | "immediateRender"
    | "clearProps"
    | "startAt"
    | "stagger"
    | "staggerConfig"
    | "onStart"
    | "onUpdate"
    | "onComplete"
    | "onRepeat"
    | "onReverseComplete"
  >
): Record<string, unknown> {
  const vars: Record<string, unknown> = {};
  const stagger = resolveStagger(keyframe as Keyframe);
  if (stagger != null) vars.stagger = stagger;
  if (typeof keyframe.repeat === "number" && keyframe.repeat !== 0) {
    vars.repeat = keyframe.repeat;
  }
  if (keyframe.yoyo) vars.yoyo = true;
  if (keyframe.repeatDelay != null && keyframe.repeatDelay > 0) {
    vars.repeatDelay = keyframe.repeatDelay;
  }
  if (keyframe.yoyoEase?.trim()) vars.yoyoEase = keyframe.yoyoEase.trim();
  const overwrite = overwriteValue(keyframe.overwrite);
  if (overwrite != null) vars.overwrite = overwrite;
  if (typeof keyframe.immediateRender === "boolean") {
    vars.immediateRender = keyframe.immediateRender;
  }
  if (keyframe.clearProps?.trim()) vars.clearProps = keyframe.clearProps.trim();
  const startAt = parseStartAt(keyframe.startAt);
  if (startAt) vars.startAt = startAt;

  CALLBACK_KEYS.forEach((key) => {
    const source = keyframe[key]?.trim();
    if (!source) return;
    const fn = isFunctionSource(source)
      ? compileFunction(source)
      : compileFunction(source);
    if (fn) vars[key] = fn;
  });
  return vars;
}

export function tweenControlCodeParts(keyframe: Keyframe): string[] {
  const parts: string[] = [];
  const stagger = resolveStagger(keyframe);
  if (typeof stagger === "number") parts.push(`stagger: ${stagger}`);
  else if (stagger) parts.push(`stagger: ${JSON.stringify(stagger)}`);
  if (typeof keyframe.repeat === "number" && keyframe.repeat !== 0) {
    parts.push(`repeat: ${keyframe.repeat}`);
  }
  if (keyframe.yoyo) parts.push("yoyo: true");
  if (keyframe.repeatDelay != null && keyframe.repeatDelay > 0) {
    parts.push(`repeatDelay: ${keyframe.repeatDelay}`);
  }
  if (keyframe.yoyoEase?.trim()) {
    parts.push(`yoyoEase: ${formatCodeValue(keyframe.yoyoEase.trim())}`);
  }
  const overwrite = overwriteValue(keyframe.overwrite);
  if (overwrite != null) parts.push(`overwrite: ${formatCodeValue(overwrite)}`);
  if (typeof keyframe.immediateRender === "boolean") {
    parts.push(`immediateRender: ${keyframe.immediateRender}`);
  }
  if (keyframe.clearProps?.trim()) {
    parts.push(`clearProps: ${formatCodeValue(keyframe.clearProps.trim())}`);
  }
  const startAt = parseStartAt(keyframe.startAt);
  if (startAt) parts.push(`startAt: ${JSON.stringify(startAt)}`);
  CALLBACK_KEYS.forEach((key) => {
    const source = keyframe[key]?.trim();
    if (!source) return;
    if (isFunctionSource(source)) parts.push(`${key}: ${source}`);
    else parts.push(`${key}: function(){ ${source} }`);
  });
  return parts;
}

export function hasTweenControls(keyframe: Keyframe): boolean {
  return tweenControlCodeParts(keyframe).length > 0;
}
