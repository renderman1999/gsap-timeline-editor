import * as React from "react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import {
  shouldHandleNumericWheel,
  stepNumericText,
  valueFromNumericWheel,
} from "@/lib/numeric-wheel";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "default";
  /** Moltiplicatore dello step con Shift + rotellina. Default 10. */
  wheelShiftMultiplier?: number;
  /** Rotellina anche su type="text": cambia il primo numero e conserva unità e +=. */
  numericWheel?: boolean;
}

function Input({
  className,
  type,
  size = "sm",
  onChange,
  onWheel,
  step,
  min,
  max,
  value,
  wheelShiftMultiplier,
  numericWheel = false,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const useNumber = type === "number";
    const useText = !useNumber && numericWheel;
    if (!useNumber && !useText) return;
    const el = inputRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!shouldHandleNumericWheel(el)) return;

      const raw = el.value;
      let nextText: string;
      if (useNumber) {
        const parsed = parseFloat(raw);
        const current = Number.isFinite(parsed) ? parsed : 0;
        const next = valueFromNumericWheel(current, e, {
          step,
          min,
          max,
          shiftMultiplier: wheelShiftMultiplier,
        });
        if (next === current) return;
        nextText = String(next);
      } else {
        const next = stepNumericText(raw, e, {
          step,
          min,
          max,
          shiftMultiplier: wheelShiftMultiplier,
        });
        if (next === null || next === raw) return;
        nextText = next;
      }

      e.preventDefault();
      e.stopPropagation();
      el.value = nextText;
      onChangeRef.current?.({
        target: el,
        currentTarget: el,
      } as React.ChangeEvent<HTMLInputElement>);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [type, step, min, max, wheelShiftMultiplier, numericWheel]);

  return (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      data-size={size}
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      onWheel={onWheel}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        size === "default" && "h-9 py-1",
        size === "sm" && "h-7 py-0.5 text-xs px-1",
        className
      )}
      {...props}
    />
  );
}

export { Input };