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