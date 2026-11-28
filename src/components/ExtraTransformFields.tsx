"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Transform } from "@/stores/timeline-store";
import { GsapValueInput } from "@/components/GsapValueInput";

type Props = {
  transform: Transform;
  onUpdate: (values: Record<string, number | string>) => void;
};

function flag(value: number | string | undefined): boolean {
  return value === 1 || value === "1";
}

export function ExtraTransformFields({ transform, onUpdate }: Props) {
  const values = transform.values;
  const set = (partial: Record<string, number | string>) =>
    onUpdate({ ...values, ...partial });

  switch (transform.type) {
    case "autoAlpha":
      return (
        <GsapValueInput
          label="autoAlpha"
          step="0.01"
          min={0}
          max={1}
          value={values.autoAlpha}
          onChange={(autoAlpha) => set({ autoAlpha })}
        />
      );
    case "transformOrigin":
      return (
        <Input
          className="h-8 max-w-[10rem] text-xs"
          value={String(values.transformOrigin ?? "")}
          placeholder="50% 50%"
          onChange={(event) => set({ transformOrigin: event.target.value })}
        />
      );
    case "svgOrigin":
      return (
        <Input
          className="h-8 max-w-[10rem] text-xs"
          value={String(values.svgOrigin ?? "")}
          placeholder="0 0"
          onChange={(event) => set({ svgOrigin: event.target.value })}
        />
      );
    case "cssProp":
      return (
        <div className="flex items-center gap-2">
          <Input
            className="h-8 max-w-[7rem] text-xs"
            value={String(values.property ?? "")}
            placeholder="width"
            onChange={(event) => set({ property: event.target.value })}
          />
          <GsapValueInput
            value={values.value}
            onChange={(value) => set({ value })}
          />
        </div>
      );
    case "scrambleText":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            className="h-8 text-xs"
            value={String(values.text ?? "")}
            placeholder="testo"
            onChange={(event) => set({ text: event.target.value })}
          />
          <Input
            className="h-8 text-xs"
            value={String(values.chars ?? "")}
            placeholder="chars"
            onChange={(event) => set({ chars: event.target.value })}
          />
          <GsapValueInput
            label="delay"
            value={values.revealDelay}
            onChange={(revealDelay) => set({ revealDelay })}
          />
          <GsapValueInput
            label="speed"
            value={values.speed}
            onChange={(speed) => set({ speed })}
          />
          <div className="flex items-center gap-2 col-span-2">
            <Switch
              checked={flag(values.rightToLeft)}
              onCheckedChange={(checked) =>
                set({ rightToLeft: checked ? 1 : 0 })
              }
            />
            <Label className="text-xs">Da destra</Label>
          </div>
        </div>
      );
    case "physics2D":
      return (
        <div className="grid grid-cols-2 gap-2">
          <GsapValueInput
            label="vel"
            value={values.velocity}
            onChange={(velocity) => set({ velocity })}
          />
          <GsapValueInput
            label="angolo"
            value={values.angle}
            onChange={(angle) => set({ angle })}
          />
          <GsapValueInput
            label="gravità"
            value={values.gravity}
            onChange={(gravity) => set({ gravity })}
          />
          <GsapValueInput
            label="attrito"
            value={values.friction}
            onChange={(friction) => set({ friction })}
          />
          <GsapValueInput
            label="acc"
            value={values.acceleration}
            onChange={(acceleration) => set({ acceleration })}
          />
          <GsapValueInput
            label="acc ang"
            value={values.accelerationAngle}
            onChange={(accelerationAngle) => set({ accelerationAngle })}
          />
        </div>
      );
    case "physicsProps":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-8 max-w-[4rem] text-xs"
            value={String(values.property ?? "x")}
            onChange={(event) => set({ property: event.target.value })}
          />
          <GsapValueInput
            label="vel"
            value={values.velocity}
            onChange={(velocity) => set({ velocity })}
          />
          <GsapValueInput
            label="acc"
            value={values.acceleration}
            onChange={(acceleration) => set({ acceleration })}
          />
          <GsapValueInput
            label="attrito"
            value={values.friction}
            onChange={(friction) => set({ friction })}
          />
        </div>
      );
    case "scrollTo":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            className="h-8 text-xs col-span-2"
            value={String(values.scrollTarget ?? "window")}
            placeholder="window oppure #scroller"
            onChange={(event) => set({ scrollTarget: event.target.value })}
          />
          <GsapValueInput
            label="x"
            value={values.x}
            onChange={(x) => set({ x })}
          />
          <GsapValueInput
            label="y"
            value={values.y}
            onChange={(y) => set({ y })}
          />
          <GsapValueInput
            label="offsetX"
            value={values.offsetX}
            onChange={(offsetX) => set({ offsetX })}
          />
          <GsapValueInput
            label="offsetY"
            value={values.offsetY}
            onChange={(offsetY) => set({ offsetY })}
          />
        </div>
      );
    case "flip":
      return (
        <div className="space-y-2">
          <Input
            className="h-8 text-xs"
            value={String(values.toggleClass ?? "")}
            placeholder="classe da alternare"
            onChange={(event) => set({ toggleClass: event.target.value })}
          />
          <div className="flex flex-wrap gap-3">
            {(
              [
                ["absolute", "absolute"],
                ["nested", "nested"],
                ["scale", "scale"],
                ["simple", "simple"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-1 text-xs">
                <Switch
                  checked={flag(values[key])}
                  onCheckedChange={(checked) =>
                    set({ [key]: checked ? 1 : 0 })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}
