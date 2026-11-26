"use client";

import { useEffect, useState } from "react";
import { ColorField } from "@/components/ColorField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_BOUNDS_CLASS,
  DEFAULT_GRADIENT_ANGLE,
  DEFAULT_GRADIENT_FROM,
  DEFAULT_GRADIENT_TO,
  buildLinearGradientCss,
  normalizeBoundsClass,
  timelineHasGradientStops,
} from "@/lib/timeline-stage";
import { DEFAULT_STAGE_PERSPECTIVE } from "@/lib/css3d";
import type { Timeline } from "@/stores/timeline-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeline: Timeline | null;
  onSave: (updates: {
    name: string;
    previewBackground?: string;
    previewGradientFrom?: string;
    previewGradientTo?: string;
    previewGradientAngle?: number;
    previewBackgroundGradient?: string;
    boundsClass?: string;
    stagePerspective?: number;
  }) => void;
};

export function TimelineProjectDialog({
  open,
  onOpenChange,
  timeline,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [solidBg, setSolidBg] = useState("#0a0a0a");
  const [useGradient, setUseGradient] = useState(false);
  const [gradientFrom, setGradientFrom] = useState(DEFAULT_GRADIENT_FROM);
  const [gradientTo, setGradientTo] = useState(DEFAULT_GRADIENT_TO);
  const [gradientAngle, setGradientAngle] = useState(DEFAULT_GRADIENT_ANGLE);
  const [boundsClass, setBoundsClass] = useState(DEFAULT_BOUNDS_CLASS);
  const [stagePerspective, setStagePerspective] = useState(
    DEFAULT_STAGE_PERSPECTIVE
  );

  useEffect(() => {
    if (!open || !timeline) return;
    setName(timeline.name);
    setSolidBg(timeline.previewBackground?.trim() || "#0a0a0a");
    const hasGradient = timelineHasGradientStops(timeline);
    setUseGradient(hasGradient);
    setGradientFrom(
      timeline.previewGradientFrom?.trim() || DEFAULT_GRADIENT_FROM
    );
    setGradientTo(timeline.previewGradientTo?.trim() || DEFAULT_GRADIENT_TO);
    setGradientAngle(timeline.previewGradientAngle ?? DEFAULT_GRADIENT_ANGLE);
    setBoundsClass(
      normalizeBoundsClass(timeline.boundsClass ?? DEFAULT_BOUNDS_CLASS)
    );
    setStagePerspective(
      timeline.stagePerspective ?? DEFAULT_STAGE_PERSPECTIVE
    );
  }, [open, timeline]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const angle = gradientAngle || DEFAULT_GRADIENT_ANGLE;
    if (useGradient) {
      onSave({
        name: trimmedName,
        previewBackground: undefined,
        previewGradientFrom: gradientFrom,
        previewGradientTo: gradientTo,
        previewGradientAngle: angle,
        previewBackgroundGradient: buildLinearGradientCss(
          gradientFrom,
          gradientTo,
          angle
        ),
        boundsClass: normalizeBoundsClass(boundsClass),
        stagePerspective,
      });
    } else {
      onSave({
        name: trimmedName,
        previewBackground: solidBg,
        previewGradientFrom: undefined,
        previewGradientTo: undefined,
        previewGradientAngle: undefined,
        previewBackgroundGradient: undefined,
        boundsClass: normalizeBoundsClass(boundsClass),
        stagePerspective,
      });
    }
    onOpenChange(false);
  };

  const boundsSelector = `.${normalizeBoundsClass(boundsClass)}`;
  const gradientPreview = buildLinearGradientCss(
    gradientFrom,
    gradientTo,
    gradientAngle
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impostazioni progetto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome timeline</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome progetto"
            />
          </div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm">Sfondo pagina</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="use-gradient"
                  checked={useGradient}
                  onCheckedChange={setUseGradient}
                />
                <Label htmlFor="use-gradient" className="text-xs cursor-pointer">
                  Gradiente
                </Label>
              </div>
            </div>
            {useGradient ? (
              <div className="space-y-3">
                <ColorField
                  label="Colore inizio"
                  value={gradientFrom}
                  withAlpha
                  onChange={setGradientFrom}
                />
                <ColorField
                  label="Colore fine"
                  value={gradientTo}
                  withAlpha
                  onChange={setGradientTo}
                />
                <div className="space-y-1">
                  <Label className="text-xxs text-muted-foreground">
                    Angolo (gradi)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={360}
                    className="h-8 w-24 text-xs"
                    value={gradientAngle}
                    onChange={(e) =>
                      setGradientAngle(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
                {gradientPreview ? (
                  <div
                    className="h-10 w-full rounded-md border border-border"
                    style={{ background: gradientPreview }}
                    aria-hidden
                  />
                ) : null}
              </div>
            ) : (
              <ColorField
                label="Colore sfondo"
                value={solidBg}
                withAlpha
                onChange={setSolidBg}
              />
            )}
            <p className="text-xxs text-muted-foreground">
              Copre tutta l&apos;area preview nell&apos;editor e{" "}
              <code className="font-mono">body</code> nell&apos;HTML esportato.
            </p>
          </div>

          <div className="space-y-1.5 rounded-md border border-border p-3">
            <Label>Perspective CSS 3D (px)</Label>
            <Input
              type="number"
              min={0}
              max={5000}
              className="h-8 w-28 text-xs"
              value={stagePerspective}
              onChange={(e) =>
                setStagePerspective(parseInt(e.target.value, 10) || 0)
              }
            />
            <p className="text-xxs text-muted-foreground leading-snug">
              Usata sullo stage quando un keyframe ha Rotate X/Y o Depth (Z).
              0 = nessuna perspective forzata; consigliato 600–1200.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Classe bounds (Draggable)</Label>
            <Input
              className="font-mono text-xs"
              value={boundsClass}
              onChange={(e) => setBoundsClass(e.target.value)}
              placeholder={DEFAULT_BOUNDS_CLASS}
            />
            <p className="text-xxs text-muted-foreground">
              Selettore: <code className="font-mono">{boundsSelector}</code>.
              Limite drag se il layer non ha bounds propri (preview + export).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={handleSave}>
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}