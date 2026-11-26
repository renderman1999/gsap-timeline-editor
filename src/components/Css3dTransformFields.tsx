"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DegreeFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function TransformDegreeField({
  label,
  value,
  onChange,
}: DegreeFieldProps) {
  return (
    <div className="flex items-center gap-2 ml-3">
      {label ? <Label className="text-xs shrink-0">{label}</Label> : null}
      <Input
        type="number"
        value={value}
        min={-360}
        max={360}
        className="max-w-[4.5rem]"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      <span className="text-xs text-muted-foreground">deg</span>
    </div>
  );
}

export function TransformZDepthField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 ml-3">
      <Input
        type="number"
        value={value}
        className="max-w-[4.5rem]"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      <span className="text-xs text-muted-foreground">px (Z)</span>
    </div>
  );
}