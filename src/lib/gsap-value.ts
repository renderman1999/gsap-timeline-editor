const FUNCTION_SOURCE =
  /^(async\s+)?function\b|^\([^)]*\)\s*=>|^[A-Za-z_$][\w$]*\s*=>/;

const RELATIVE_VALUE = /^[+\-*/]=/;

export function isFunctionSource(value: string): boolean {
  return FUNCTION_SOURCE.test(value.trim());
}

export function isRelativeValue(value: string): boolean {
  return RELATIVE_VALUE.test(value.trim());
}

/** Mantiene numeri, valori relativi e funzioni mentre si digita. */
export function parseGsapInput(raw: string): number | string {
  const trimmed = raw.trim();
  if (!trimmed) return raw === "" ? "" : raw;
  if (isRelativeValue(trimmed) || isFunctionSource(trimmed)) return trimmed;
  if (/^-?\d+([.,]\d+)?$/.test(trimmed)) {
    return Number(trimmed.replace(",", "."));
  }
  return raw;
}

export function compileFunction(
  source: string
): ((...args: unknown[]) => unknown) | undefined {
  const src = source.trim();
  if (!src) return undefined;
  try {
    if (isFunctionSource(src)) {
      const fn = new Function(`return (${src});`)();
      return typeof fn === "function"
        ? (fn as (...args: unknown[]) => unknown)
        : undefined;
    }
    return new Function(src) as (...args: unknown[]) => unknown;
  } catch {
    return undefined;
  }
}

export function materializeTweenValue(value: unknown): unknown {
  if (typeof value === "string" && isFunctionSource(value)) {
    return compileFunction(value) ?? value;
  }
  return value;
}

export function formatPositionArg(position: number | string): string {
  if (typeof position === "number" && Number.isFinite(position)) {
    return String(position);
  }
  const text = String(position).trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return text;
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function rotationWithSuffix(
  value: number | string | undefined,
  dir: number | string | undefined
): number | string {
  const base = value == null || value === "" ? 0 : value;
  const suffix =
    dir === "_short" || dir === "_cw" || dir === "_ccw" ? dir : "";
  if (!suffix) return base;
  if (typeof base === "string" && isFunctionSource(base)) return base;
  return `${base}${suffix}`;
}

const BLOCKED_CSS_PROPS = new Set([
  "duration",
  "ease",
  "stagger",
  "repeat",
  "yoyo",
  "delay",
  "overwrite",
  "immediateRender",
  "onStart",
  "onUpdate",
  "onComplete",
  "onRepeat",
  "onReverseComplete",
  "scrollTrigger",
  "keyframes",
  "startAt",
  "clearProps",
  "callbackScope",
  "data",
  "id",
  "paused",
  "lazy",
  "inherit",
  "constructor",
  "__proto__",
  "prototype",
]);

export function cssPropName(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const camel = trimmed.replace(/-([a-z])/g, (_, char: string) =>
    char.toUpperCase()
  );
  if (!/^[A-Za-z_][\w]*$/.test(camel)) return null;
  if (BLOCKED_CSS_PROPS.has(camel)) return null;
  return camel;
}

export function formatCodeValue(value: unknown): string {
  if (typeof value === "string") {
    if (isFunctionSource(value)) return value.trim();
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) return "undefined";
  return JSON.stringify(value);
}
