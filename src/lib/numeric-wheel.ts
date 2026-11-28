import { isFunctionSource } from "@/lib/gsap-value";

const DEFAULT_SHIFT_MULTIPLIER = 10;

export function parseInputStep(step: string | number | undefined): number {
  if (step === undefined || step === "any") return 1;
  const n = typeof step === "number" ? step : parseFloat(step);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function decimalPlacesFromStep(step: string | number | undefined): number | null {
  if (step === undefined || step === "any") return null;
  const s = String(step);
  if (!s.includes(".")) return null;
  return s.split(".")[1]?.length ?? 0;
}

export function valueFromNumericWheel(
  currentValue: number,
  wheel: Pick<WheelEvent, "deltaY" | "shiftKey">,
  options: {
    step?: string | number;
    min?: string | number;
    max?: string | number;
    shiftMultiplier?: number;
  }
): number {
  const baseStep = parseInputStep(options.step);
  const shiftMult = options.shiftMultiplier ?? DEFAULT_SHIFT_MULTIPLIER;
  const factor = wheel.shiftKey ? shiftMult : 1;
  const direction = wheel.deltaY < 0 ? 1 : -1;
  let next = currentValue + direction * baseStep * factor;

  if (options.min !== undefined && options.min !== "") {
    const min = parseFloat(String(options.min));
    if (Number.isFinite(min)) next = Math.max(min, next);
  }
  if (options.max !== undefined && options.max !== "") {
    const max = parseFloat(String(options.max));
    if (Number.isFinite(max)) next = Math.min(max, next);
  }

  const decimals = decimalPlacesFromStep(options.step);
  if (decimals !== null) {
    next = parseFloat(next.toFixed(decimals));
  } else if (baseStep >= 1 && factor === 1) {
    next = Math.round(next);
  }

  return next;
}

export function shouldHandleNumericWheel(el: HTMLInputElement): boolean {
  return document.activeElement === el || el.matches(":hover");
}

const RELATIVE_PREFIX = /^(?:\+=|-=|\*=|\/=)/;

function numericToken(raw: string): {
  start: number;
  end: number;
  value: number;
  text: string;
} | null {
  const op = RELATIVE_PREFIX.exec(raw);
  const from = op ? op[0].length : 0;
  const match = /[+-]?(?:\d+\.?\d*|\.\d+)/.exec(raw.slice(from));
  if (!match || match.index === undefined) return null;
  const value = parseFloat(match[0]);
  if (!Number.isFinite(value)) return null;
  return {
    start: from + match.index,
    end: from + match.index + match[0].length,
    value,
    text: match[0],
  };
}

function inferredStep(token: string): number {
  const decimals = token.split(".")[1];
  if (!decimals) return 1;
  return 10 ** -decimals.length;
}

function formatSteppedNumber(
  value: number,
  step: string | number | undefined
): string {
  const decimals = decimalPlacesFromStep(step);
  if (decimals !== null) return value.toFixed(decimals);
  if (Number.isInteger(value)) return String(value);
  return String(parseFloat(value.toFixed(6)));
}

/**
 * Incrementa il primo numero nel testo e tiene prefisso (`+=`) e unità (`px`, `%`).
 * Restituisce null se il testo non contiene un numero.
 */
export function stepNumericText(
  raw: string,
  wheel: Pick<WheelEvent, "deltaY" | "shiftKey">,
  options: {
    step?: string | number;
    min?: string | number;
    max?: string | number;
    shiftMultiplier?: number;
  } = {}
): string | null {
  if (isFunctionSource(raw.trim())) return null;
  const token = numericToken(raw);
  if (!token && raw.trim()) return null;

  const step = options.step ?? (token ? inferredStep(token.text) : 1);
  const current = token?.value ?? 0;
  const next = valueFromNumericWheel(current, wheel, { ...options, step });
  if (token && next === current) return raw;

  const formatted = formatSteppedNumber(next, step);
  if (!token) return formatted;
  return raw.slice(0, token.start) + formatted + raw.slice(token.end);
}