"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_MOTION_PATH_SELECTOR } from "@/lib/gsap-motion-path";
import type { Transform } from "@/stores/timeline-store";

type Props = {
  transform: Transform;
  onUpdate: (values: Record<string, number | string>) => void;
};

export function MotionPathTransformFields({ transform, onUpdate }: Props) {
  const path = (transform.values.path as string) ?? DEFAULT_MOTION_PATH_SELECTOR;
  const autoRotate =
    transform.values.autoRotate === 1 || transform.values.autoRotate === "1";
  const align = (transform.values.align as string) ?? "self";
  const alignOrigin =
    (transform.values.alignOrigin as string) ?? "0.5, 0.5";
  const start = transform.values.start as number | string | undefined;
  const end = transform.values.end as number | string | undefined;

  return (
    <div className="flex flex-col gap-2 min-w-0 flex-1">
      <div className="space-y-1">
        <Label className="text-xxs">path (selettore o dati SVG)</Label>
        <Input
          className="h-8 text-xs font-mono"
          value={path}
          placeholder={DEFAULT_MOTION_PATH_SELECTOR}
          onChange={(e) =>
            onUpdate({ ...transform.values, path: e.target.value })
          }
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id={`mp-autorotate-${transform.id}`}
          checked={autoRotate}
          onCheckedChange={(checked) =>
            onUpdate({
              ...transform.values,
              autoRotate: checked ? 1 : 0,
            })
          }
        />
        <Label
          htmlFor={`mp-autorotate-${transform.id}`}
          className="text-xxs cursor-pointer"
        >
          autoRotate
        </Label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xxs">align</Label>
          <Input
            className="h-8 text-xs font-mono"
            value={align}
            placeholder="self o #motion-path"
            onChange={(e) =>
              onUpdate({ ...transform.values, align: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">alignOrigin</Label>
          <Input
            className="h-8 text-xs font-mono"
            value={alignOrigin}
            placeholder="0.5, 0.5"
            onChange={(e) =>
              onUpdate({
                ...transform.values,
                alignOrigin: e.target.value,
              })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xxs">start (0-1)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={1}
            className="h-8 text-xs"
            value={start ?? ""}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value.trim();
              onUpdate({
                ...transform.values,
                start: raw === "" ? "" : Number(raw),
              });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">end (0-1)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={1}
            className="h-8 text-xs"
            value={end ?? ""}
            placeholder="1"
            onChange={(e) => {
              const raw = e.target.value.trim();
              onUpdate({
                ...transform.values,
                end: raw === "" ? "" : Number(raw),
              });
            }}
          />
        </div>
      </div>
      <p className="text-xxs text-muted-foreground">
        Usa {DEFAULT_MOTION_PATH_SELECTOR} nella preview; con Move nello stesso
        keyframe il path ha priorità.
      </p>
    </div>
  );
}