"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clampAlpha,
  formatRgba,
  parseCssColor,
  rgbaToHex6,
  rgbaToHex8,
  type Rgba,
} from "@/lib/css-color";

function pickerHexFromCssColor(value: string | undefined, fallback: string): string {
  const parsed = parseCssColor(value);
  if (parsed) return rgbaToHex6(parsed);
  return fallback;
}

function pickerHex8FromCssColor(value: string | undefined, fallback: string): string {
  const parsed = parseCssColor(value);
  if (parsed) return rgbaToHex8(parsed);
  const base = parseCssColor(fallback);
  return base ? rgbaToHex8(base) : "#00000080";
}

type Props = {
  label: string;
  value: string | undefined;
  placeholder?: string;
  pickerFallback?: string;
  /** Slider alpha + input rgba / hex8 */
  withAlpha?: boolean;
  onChange: (value: string) => void;
};

export function ColorField({
  label,
  value,
  placeholder,
  pickerFallback = "#ffffff",
  withAlpha = false,
  onChange,
}: Props) {
  const parsed = parseCssColor(value);
  const alphaPercent = Math.round((parsed?.a ?? 1) * 100);

  const applyRgba = (next: Rgba) => {
    onChange(formatRgba(next));
  };

  const onPickerChange = (hex: string) => {
    if (withAlpha) {
      const fromPicker = parseCssColor(hex);
      if (!fromPicker) return;
      applyRgba({ ...fromPicker, a: parsed?.a ?? 1 });
      return;
    }
    onChange(hex);
  };

  const onPickerChangeWithAlpha = (hex8: string) => {
    const fromPicker = parseCssColor(hex8);
    if (fromPicker) {
      onChange(formatRgba(fromPicker));
    }
  };

  const onAlphaChange = (percent: number) => {
    const base =
      parsed ??
      parseCssColor(pickerFallback) ?? {
        r: 255,
        g: 255,
        b: 255,
        a: 1,
      };
    applyRgba({ ...base, a: clampAlpha(percent / 100) });
  };

  if (withAlpha) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_5rem] gap-2 items-end">
          <div className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={value ?? ""}
              placeholder={placeholder ?? "rgba(0,0,0,0.35)"}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xxs">Campione</Label>
            <Input
              type="color"
              className="h-9 p-1 cursor-pointer"
              value={pickerHex8FromCssColor(value, pickerFallback)}
              onChange={(e) => onPickerChangeWithAlpha(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-[auto_1fr_3rem] gap-2 items-center">
          <Label className="text-xxs text-muted-foreground shrink-0">
            Alpha
          </Label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            className="w-full h-2 accent-primary"
            value={alphaPercent}
            onChange={(e) => onAlphaChange(Number(e.target.value))}
          />
          <span className="text-xxs text-muted-foreground text-right tabular-nums">
            {alphaPercent}%
          </span>
        </div>
      </div>
    );
  }

  const pickerValue = pickerHexFromCssColor(value, pickerFallback);

  return (
    <div className="grid grid-cols-[1fr_5rem] gap-2 items-end">
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Input
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xxs">Campione</Label>
        <Input
          type="color"
          className="h-9 p-1 cursor-pointer"
          value={pickerValue}
          onChange={(e) => onPickerChange(e.target.value)}
        />
      </div>
    </div>
  );
}