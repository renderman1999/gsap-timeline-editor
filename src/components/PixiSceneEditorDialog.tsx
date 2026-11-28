"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PixiLayerPreview } from "@/components/PixiLayerPreview";
import type { PixiLayerSettings } from "@/lib/pixi-scene";
import { DEFAULT_PIXI_SCENE } from "@/lib/pixi-scene";
import {
  applyPixiPresetCode,
  PIXI_SCENE_PRESETS,
} from "@/lib/pixi-scene-presets";
import { buildPixiIsolatedPreviewTarget } from "@/lib/pixi-preview-target";

type PixiSceneEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetName: string;
  pixiScene: string | undefined;
  pixiSettings: PixiLayerSettings | undefined;
  onSave: (pixiScene: string) => void;
};

export function PixiSceneEditorDialog({
  open,
  onOpenChange,
  targetId,
  targetName,
  pixiScene,
  pixiSettings,
  onSave,
}: PixiSceneEditorDialogProps) {
  const [draft, setDraft] = useState(pixiScene ?? "");
  const [playScene, setPlayScene] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [presetKey, setPresetKey] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(pixiScene ?? "");
      setPlayScene(null);
      setPlayKey(0);
    }
  }, [open, pixiScene]);

  const previewTarget = useMemo(
    () =>
      buildPixiIsolatedPreviewTarget(
        targetId,
        "scene-editor",
        targetName,
        pixiScene,
        pixiSettings,
        playScene ?? undefined
      ),
    [targetId, targetName, playScene, pixiSettings, pixiScene]
  );

  const handlePlay = () => {
    const next = draft.trim() || DEFAULT_PIXI_SCENE;
    setPlayScene(next);
    setPlayKey((k) => k + 1);
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const insertPreset = (presetId: string) => {
    const preset = PIXI_SCENE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDraft((prev) => applyPixiPresetCode(prev || undefined, preset));
    setPresetKey("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(92vh,760px)] w-[min(96vw,56rem)] max-w-[min(96vw,56rem)] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
          <DialogTitle>Scena Pixi — {targetName}</DialogTitle>
          <p className="text-xs text-muted-foreground font-normal pt-1">
            Parametri: PIXI, app, root, layerId. Play prova il codice qui sotto;
            Salva applica al layer e all&apos;anteprima principale.
          </p>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="flex min-h-0 flex-1 flex-col gap-3 border-b border-border p-4 md:border-b-0 md:border-r">
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Select
                value={presetKey || undefined}
                onValueChange={(id) => {
                  setPresetKey(id);
                  insertPreset(id);
                }}
              >
                <SelectTrigger className="h-8 text-xs flex-1 min-w-[12rem]">
                  <SelectValue placeholder="Inserisci preset…" />
                </SelectTrigger>
                <SelectContent>
                  {PIXI_SCENE_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {`${p.label} (${p.hint})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setDraft("")}
              >
                Svuota
              </Button>
            </div>
            <Label className="text-xxs text-muted-foreground sr-only">
              Codice scena
            </Label>
            <Textarea
              className="min-h-[200px] flex-1 resize-none font-mono text-xs leading-relaxed"
              value={draft}
              spellCheck={false}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 bg-muted/25 p-4 md:w-[min(100%,20rem)]">
            <Button
              type="button"
              className="w-full gap-2"
              onClick={handlePlay}
            >
              <Play className="h-4 w-4" />
              Play anteprima
            </Button>
            <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-md border border-border bg-zinc-950/90 p-2">
              {playScene != null ? (
                <PixiLayerPreview
                  key={playKey}
                  target={previewTarget}
                />
              ) : (
                <p className="text-xxs text-muted-foreground text-center px-2">
                  Premi Play per eseguire il codice nel riquadro senza salvare.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Salva scena
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}