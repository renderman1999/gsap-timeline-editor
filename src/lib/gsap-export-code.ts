import type { AnimationTarget } from "@/stores/timeline-store";

function escapeSelectorAttrValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function escapeJsString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Selettore CSS in stringa JS doppio-apice (export HTML). */
export function jsQuotedSelector(selector: string): string {
  return `"${escapeJsString(selector)}"`;
}

/** Un solo elemento per layer (export HTML + tween). */
export function domTweenSelector(target: AnimationTarget): string {
  return `[data-preview-target="${escapeSelectorAttrValue(target.id)}"]`;
}