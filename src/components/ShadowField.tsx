"use client";

import { useEffect, useMemo, useState } from "react";
import { ColorField } from "@/components/ColorField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultBoxShadowParts,
  defaultTextShadowParts,
  formatBoxShadow,
  formatTextShadow,
  parseBoxShadow,
  parseTextShadow,
  type BoxShadowParts,
  type TextShadowParts,
} from "@/lib/shadow-css";

type BaseProps = {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
};

export function BoxShadowField({ label, value, onChange }: BaseProps) {
  const [advanced, setAdvanced] = useState(() => {
    if (!value?.trim()) return false;
    return parseBoxShadow(value) === null;
  });

  const parts = useMemo(
    () => parseBoxShadow(value) ?? defaultBoxShadowParts(),
    [value]
  );

  useEffect(() => {
    if (!value?.trim()) {
      setAdvanced(false);
      return;
    }
    if (parseBoxShadow(value) === null) setAdvanced(true);
  }, [value]);

  const setParts = (next: BoxShadowParts) => {
    onChange(formatBoxShadow(next));
    setAdvanced(false);
  };

  if (advanced) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label>{label}</Label>
          <button
            type="button"
            className="text-xxs text-primary hover:underline"
            onClick={() => {
              setAdvanced(false);
              if (!parseBoxShadow(value)) {
                onChange(formatBoxShadow(defaultBoxShadowParts()));
              }
            }}
          >
            Builder
          </button>
        </div>
        <Input
          value={value ?? ""}
          placeholder="0 8px 32px rgba(0,0,0,0.35)"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <button
          type="button"
          className="text-xxs text-muted-foreground hover:text-primary hover:underline"
          onClick={() => setAdvanced(true)}
        >
          CSS libero
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label className="text-xxs">X</Label>
          <Input
            numericWheel
            value={parts.offsetX}
            onChange={(e) =>
              setParts({ ...parts, offsetX: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">Y</Label>
          <Input
            numericWheel
            value={parts.offsetY}
            onChange={(e) =>
              setParts({ ...parts, offsetY: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">Blur</Label>
          <Input
            numericWheel
            value={parts.blur}
            onChange={(e) => setParts({ ...parts, blur: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">Spread</Label>
          <Input
            numericWheel
            value={parts.spread}
            onChange={(e) =>
              setParts({ ...parts, spread: e.target.value })
            }
          />
        </div>
      </div>
      <ColorField
        label="Colore ombra"
        value={parts.color}
        withAlpha
        pickerFallback="rgba(0,0,0,0.35)"
        onChange={(color) => setParts({ ...parts, color })}
      />
    </div>
  );
}

export function TextShadowField({ label, value, onChange }: BaseProps) {
  const [advanced, setAdvanced] = useState(() => {
    if (!value?.trim()) return false;
    return parseTextShadow(value) === null;
  });

  const parts = useMemo(
    () => parseTextShadow(value) ?? defaultTextShadowParts(),
    [value]
  );

  useEffect(() => {
    if (!value?.trim()) {
      setAdvanced(false);
      return;
    }
    if (parseTextShadow(value) === null) setAdvanced(true);
  }, [value]);

  const setParts = (next: TextShadowParts) => {
    onChange(formatTextShadow(next));
    setAdvanced(false);
  };

  if (advanced) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label>{label}</Label>
          <button
            type="button"
            className="text-xxs text-primary hover:underline"
            onClick={() => {
              setAdvanced(false);
              if (!parseTextShadow(value)) {
                onChange(formatTextShadow(defaultTextShadowParts()));
              }
            }}
          >
            Builder
          </button>
        </div>
        <Input
          value={value ?? ""}
          placeholder="0 2px 12px rgba(0,0,0,0.8)"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <button
          type="button"
          className="text-xxs text-muted-foreground hover:text-primary hover:underline"
          onClick={() => setAdvanced(true)}
        >
          CSS libero
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xxs">X</Label>
          <Input
            numericWheel
            value={parts.offsetX}
            onChange={(e) =>
              setParts({ ...parts, offsetX: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">Y</Label>
          <Input
            numericWheel
            value={parts.offsetY}
            onChange={(e) =>
              setParts({ ...parts, offsetY: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">Blur</Label>
          <Input
            numericWheel
            value={parts.blur}
            onChange={(e) => setParts({ ...parts, blur: e.target.value })}
          />
        </div>
      </div>
      <ColorField
        label="Colore ombra"
        value={parts.color}
        withAlpha
        pickerFallback="rgba(0,0,0,0.8)"
        onChange={(color) => setParts({ ...parts, color })}
      />
    </div>
  );
}