"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseGsapInput } from "@/lib/gsap-value";

type ValueInputProps = {
  label?: string;
  value: number | string | undefined;
  onChange: (value: number | string) => void;
  className?: string;
  suffix?: string;
  step?: string | number;
  min?: string | number;
  max?: string | number;
};

export function GsapValueInput({
  label,
  value,
  onChange,
  className,
  suffix,
  step,
  min,
  max,
}: ValueInputProps) {
  return (
    <div className="flex items-center gap-1">
      {label ? <Label className="text-xs shrink-0">{label}</Label> : null}
      <Input
        type="text"
        numericWheel
        step={step}
        min={min}
        max={max}
        value={value ?? ""}
        className={className ?? "max-w-[5.5rem]"}
        onChange={(event) => onChange(parseGsapInput(event.target.value))}
      />
      {suffix ? (
        <span className="text-xs text-muted-foreground">{suffix}</span>
      ) : null}
    </div>
  );
}

const DIRECTIONS = [
  { value: "none", label: "gradi" },
  { value: "_short", label: "short" },
  { value: "_cw", label: "orario" },
  { value: "_ccw", label: "antiorario" },
] as const;

export function RotationValueFields({
  label,
  value,
  direction,
  onValue,
  onDirection,
}: {
  label?: string;
  value: number | string | undefined;
  direction: number | string | undefined;
  onValue: (value: number | string) => void;
  onDirection: (direction: string) => void;
}) {
  const dir =
    direction === "_short" || direction === "_cw" || direction === "_ccw"
      ? direction
      : "none";
  return (
    <div className="flex items-center gap-1">
      {label ? <Label className="text-xs">{label}</Label> : null}
      <GsapValueInput value={value} onChange={onValue} suffix="deg" />
      <Select value={dir} onValueChange={onDirection}>
        <SelectTrigger className="h-8 w-[6.5rem] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIRECTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
