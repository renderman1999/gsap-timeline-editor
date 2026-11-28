"use client";

import { useEffect, useMemo, useState } from "react";
import { Code2, Play, Square } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { normalizePixiLayerSettings } from "@/lib/pixi-scene";
import type { PixiCanvasAlign, PixiLayerSettings } from "@/lib/pixi-scene";
import { resolvePixiLayerLayout } from "@/lib/pixi-layer-layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PixiSceneEditorDialog } from "@/components/PixiSceneEditorDialog";
import { PixiLayerPreview } from "@/components/PixiLayerPreview";
import {
  buildPixiIsolatedPreviewTarget,
  pixiIsolatedPreviewId,
} from "@/lib/pixi-preview-target";
import { unregisterPixiLayer } from "@/lib/pixi-layer-registry";

type Props = {
  targetId: string;
  targetName: string;
  pixiScene: string | undefined;
  pixiSettings: PixiLayerSettings | undefined;
  onSceneChange: (pixiScene: string) => void;
  onSettingsChange: (pixiLayerSettings: PixiLayerSettings) => void;
};

export function PixiLayerFields({
  targetId,
  targetName,
  pixiScene,
  pixiSettings,
  onSceneChange,
  onSettingsChange,
}: Props) {
  const normalized = normalizePixiLayerSettings(pixiSettings);
  const transparent = normalized.backgroundAlpha === 0;
  const [sceneEditorOpen, setSceneEditorOpen] = useState(false);
  const [panelPreviewOpen, setPanelPreviewOpen] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  const patch = (partial: Partial<PixiLayerSettings>) => {
    onSettingsChange({ ...(pixiSettings ?? {}), ...partial });
  };

  const fillSection = normalized.fillSection;
  const layout = resolvePixiLayerLayout(pixiSettings);
  const sceneLines = (pixiScene ?? "").trim().split(/\n/).length;
  const sceneChars = (pixiScene ?? "").trim().length;

  const panelPreviewTarget = useMemo(
    () =>
      buildPixiIsolatedPreviewTarget(
        targetId,
        "panel",
        targetName,
        pixiScene,
        pixiSettings
      ),
    [targetId, targetName, pixiScene, pixiSettings]
  );

  const panelPreviewId = pixiIsolatedPreviewId(targetId, "panel");

  const togglePanelPreview = () => {
    if (panelPreviewOpen) {
      unregisterPixiLayer(panelPreviewId);
      setPanelPreviewOpen(false);
      return;
    }
    setPanelPreviewOpen(true);
    setPlayKey((k) => k + 1);
  };

  useEffect(() => {
    return () => {
      unregisterPixiLayer(panelPreviewId);
    };
  }, [panelPreviewId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5">
        <Label className="text-xxs text-muted-foreground">
          Riempi sezione full page
        </Label>
        <Switch
          checked={fillSection}
          onCheckedChange={(checked) => patch({ fillSection: checked })}
        />
      </div>
      {fillSection ? (
        <p className="text-xxs text-muted-foreground leading-snug">
          Il canvas usa larghezza e altezza della sezione (100%). Le dimensioni
          manuali valgono fuori dalle sezioni fullpage.
        </p>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-2 gap-2",
          fillSection && "opacity-50 pointer-events-none"
        )}
      >
        <div className="space-y-1">
          <Label className="text-xxs text-muted-foreground">Larghezza (px)</Label>
          <Input
            type="number"
            min={64}
            max={2048}
            className="h-8 text-xs"
            value={pixiSettings?.width ?? 320}
            onChange={(e) =>
              patch({ width: Number(e.target.value) || 320 })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs text-muted-foreground">Altezza (px)</Label>
          <Input
            type="number"
            min={64}
            max={2048}
            className="h-8 text-xs"
            value={pixiSettings?.height ?? 240}
            onChange={(e) =>
              patch({ height: Number(e.target.value) || 240 })
            }
          />
        </div>
      </div>
      <div
        className={cn(
          "space-y-2 rounded-md border border-border/60 p-2",
          fillSection && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xxs text-muted-foreground">
            Posizione sullo schermo
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] px-2"
            onClick={() =>
              patch({
                alignX: "center",
                alignY: "center",
                offsetX: 0,
                offsetY: 0,
              })
            }
          >
            Centra
          </Button>
        </div>
        <p className="text-xxs text-muted-foreground leading-snug">
          Allinea il riquadro canvas nello stage; offset in pixel dopo
          l&apos;allineamento. L&apos;animazione GSAP muove ancora{" "}
          <span className="font-mono">root</span> Pixi.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xxs text-muted-foreground">
              Orizzontale
            </Label>
            <Select
              value={layout.alignX}
              onValueChange={(v) => patch({ alignX: v as PixiCanvasAlign })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Sinistra</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="end">Destra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xxs text-muted-foreground">Verticale</Label>
            <Select
              value={layout.alignY}
              onValueChange={(v) => patch({ alignY: v as PixiCanvasAlign })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Alto</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="end">Basso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xxs text-muted-foreground">Offset X</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              value={layout.offsetX}
              onChange={(e) => patch({ offsetX: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xxs text-muted-foreground">Offset Y</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              value={layout.offsetY}
              onChange={(e) => patch({ offsetY: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5">
        <Label className="text-xxs text-muted-foreground">
          Sfondo trasparente
        </Label>
        <Switch
          checked={transparent}
          onCheckedChange={(checked) =>
            patch({ backgroundAlpha: checked ? 0 : 1 })
          }
        />
      </div>
      {!transparent ? (
        <div className="space-y-1">
          <Label className="text-xxs text-muted-foreground">Colore sfondo</Label>
          <Input
            className="h-8 text-xs font-mono"
            value={normalized.background}
            onChange={(e) => patch({ background: e.target.value })}
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label className="text-xxs text-muted-foreground">
          Scena Pixi (JavaScript)
        </Label>
        <p className="text-xxs text-muted-foreground leading-snug">
          Pixi include <span className="font-mono">Graphics</span>,{" "}
          <span className="font-mono">Text</span>,{" "}
          <span className="font-mono">Sprite</span>,{" "}
          <span className="font-mono">Container</span> (via{" "}
          <span className="font-mono">PIXI</span>). Il centro scena è{" "}
          <span className="font-mono">(0, 0)</span> su{" "}
          <span className="font-mono">root</span>; GSAP anima{" "}
          <span className="font-mono">root</span>.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 flex-1 justify-start gap-2 text-xs min-w-0"
            onClick={() => setSceneEditorOpen(true)}
          >
            <Code2 className="h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate">
              {sceneChars > 0
                ? `Modifica (${sceneLines} righe)`
                : "Editor scena…"}
            </span>
          </Button>
          <Button
            type="button"
            variant={panelPreviewOpen ? "default" : "outline"}
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label={
              panelPreviewOpen ? "Stop anteprima scena" : "Play anteprima scena"
            }
            title={
              panelPreviewOpen
                ? "Stop (ferma ticker e chiude anteprima)"
                : "Play anteprima scena salvata"
            }
            onClick={togglePanelPreview}
          >
            {panelPreviewOpen ? (
              <Square className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
        {panelPreviewOpen ? (
          <div className="rounded-md border border-border bg-zinc-950/90 p-2 flex justify-center overflow-hidden max-h-[min(280px,40vh)]">
            <PixiLayerPreview
              key={playKey}
              target={panelPreviewTarget}
            />
          </div>
        ) : null}
        <p className="text-[10px] text-muted-foreground leading-snug">
          Play: anteprima nel pannello (Stop per chiuderla). Non interferisce con
          play della timeline. Per bozze: editor scena.
        </p>
      </div>

      <PixiSceneEditorDialog
        open={sceneEditorOpen}
        onOpenChange={setSceneEditorOpen}
        targetId={targetId}
        targetName={targetName}
        pixiScene={pixiScene}
        pixiSettings={pixiSettings}
        onSave={onSceneChange}
      />
    </div>
  );
}