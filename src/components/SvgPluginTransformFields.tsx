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
import { DRAW_SVG_PRESETS } from "@/lib/gsap-svg-plugins";
import type { Transform } from "@/stores/timeline-store";

type Props = {
  transform: Transform;
  onUpdate: (values: Record<string, number | string>) => void;
};

export function SvgPluginTransformFields({ transform, onUpdate }: Props) {
  if (transform.type === "drawSvg") {
    const current = (transform.values.drawSVG as string) ?? "0% 100%";
    const preset =
      DRAW_SVG_PRESETS.find((p) => p.value === current)?.value ?? "__custom__";

    return (
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-xxs shrink-0">drawSVG</Label>
          <Select
            value={preset}
            onValueChange={(value) => {
              if (value !== "__custom__") {
                onUpdate({ ...transform.values, drawSVG: value });
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[9rem]">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              {DRAW_SVG_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
              <SelectItem value="__custom__">Personalizzato</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          className="h-8 text-xs font-mono"
          value={current}
          placeholder='0% 100%'
          onChange={(e) =>
            onUpdate({ ...transform.values, drawSVG: e.target.value })
          }
        />
        <p className="text-xxs text-muted-foreground">
          Il path deve avere stroke visibile (stroke + stroke-width).
        </p>
      </div>
    );
  }

  if (transform.type === "morphSvg") {
    return (
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <Label className="text-xxs">morphSVG (selettore o path)</Label>
        <Input
          className="h-8 text-xs font-mono"
          value={(transform.values.morphSVG as string) ?? ""}
                  placeholder="#morph-end"
          onChange={(e) =>
            onUpdate({ ...transform.values, morphSVG: e.target.value })
          }
        />
        <p className="text-xxs text-muted-foreground">
          Target morph: id/classe di un altro path nell&apos;export, o dati path.
        </p>
      </div>
    );
  }

  return null;
}