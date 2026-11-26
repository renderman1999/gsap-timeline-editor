"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { LayerStyleDialog } from "@/components/LayerStyleDialog";
import type { TargetLayerStyle } from "@/stores/timeline-store";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AnimationTarget,
  AnimationTargetType,
  TargetShape,
  TextSplitMode,
} from "@/stores/timeline-store";
import { ImageLayerFields } from "@/components/ImageLayerFields";
import { Model3dLayerFields } from "@/components/Model3dLayerFields";
import { Model3dSceneFields } from "@/components/Model3dSceneFields";
import { Model3dInteractionTriggerButton } from "@/components/Model3dInteractionDialog";
import { DEFAULT_MODEL3D_SCENE } from "@/lib/model3d-scene";
import { SvgLayerFields } from "@/components/SvgLayerFields";
import {
  DEFAULT_DRAGGABLE_CONFIG,
  type DraggableAxisType,
} from "@/lib/gsap-draggable";
import { boundsClassSelector } from "@/lib/timeline-stage";
import { DEFAULT_MOTION_PATH_SELECTOR } from "@/lib/gsap-motion-path";
import { DEFAULT_LAYER_SVG } from "@/lib/svg-sanitize";
import { useTimelineStore } from "@/stores/timeline-store";

const SHAPE_OPTIONS: { value: TargetShape; label: string }[] = [
  { value: "square", label: "Quadrato" },
  { value: "circle", label: "Cerchio" },
  { value: "triangle", label: "Triangolo" },
  { value: "heart", label: "Heart" },
  { value: "bell", label: "Bell" },
  { value: "menu", label: "Menu" },
  { value: "audio-lines", label: "Audio" },
];

export function LayersPanel({
  timelineId,
  targets,
  activeTargetId,
}: {
  timelineId: string;
  targets: AnimationTarget[];
  activeTargetId: string;
}) {
  const {
    addTarget,
    updateTarget,
    removeTarget,
    moveTarget,
    setActiveTarget,
    setExclusiveScrollPin,
    timelines,
  } = useTimelineStore();
  const timelineMeta = timelines.find((t) => t.id === timelineId);
  const projectBoundsHint = timelineMeta
    ? boundsClassSelector(timelineMeta)
    : ".stage-bounds";
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [styleTargetId, setStyleTargetId] = useState<string | null>(null);
  const [newLayer, setNewLayer] = useState<{
    name: string;
    type: AnimationTargetType;
  }>({ name: "", type: "shape" });

  const handleAdd = () => {
    const name = newLayer.name.trim() || `Layer ${targets.length + 1}`;
    addTarget(timelineId, {
      name,
      type: newLayer.type,
      ...(newLayer.type === "svg"
        ? { svgContent: DEFAULT_LAYER_SVG }
        : {}),
    });
    setNewLayer({ name: "", type: "shape" });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.2">
          <Label className="text-sm text-muted-foreground">Layer</Label>
      
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="h-3 w-3" />
          Aggiungi
        </Button>
      </div>

      <div className="space-y-2 pr-1">
        {targets.map((target, index) => (
          <div
            key={target.id}
            className={`rounded-md border p-2 space-y-2 ${
              activeTargetId === target.id
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col shrink-0 gap-0">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Porta sopra (davanti)"
                  disabled={index >= targets.length - 1}
                  onClick={() => moveTarget(timelineId, target.id, "down")}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Porta sotto (dietro)"
                  disabled={index === 0}
                  onClick={() => moveTarget(timelineId, target.id, "up")}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
              </div>
              <button
                type="button"
                className="flex-1 text-left text-sm font-medium truncate"
                onClick={() => setActiveTarget(timelineId, target.id)}
              >
                {target.name}
                <span className="ml-1 text-xxs text-muted-foreground font-normal">
                  ({target.type})
                </span>
              </button>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="Stile layer"
                  onClick={() => setStyleTargetId(target.id)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                {targets.length > 1 ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeTarget(timelineId, target.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xxs text-muted-foreground">Selettore CSS</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={target.selector}
                onChange={(e) =>
                  updateTarget(timelineId, target.id, {
                    selector: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xxs text-muted-foreground">
                MotionPath (path SVG)
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                value={target.motionPathSelector ?? DEFAULT_MOTION_PATH_SELECTOR}
                placeholder={DEFAULT_MOTION_PATH_SELECTOR}
                onChange={(e) =>
                  updateTarget(timelineId, target.id, {
                    motionPathSelector: e.target.value,
                  })
                }
              />
            </div>

            <Input
              className="h-8 text-xs"
              value={target.name}
              placeholder="Nome layer"
              onChange={(e) =>
                updateTarget(timelineId, target.id, { name: e.target.value })
              }
            />

            <Select
              value={target.type}
              onValueChange={(value: AnimationTargetType) => {
                const updates: Partial<AnimationTarget> = { type: value };
                if (value === "svg" && !target.svgContent?.trim()) {
                  updates.svgContent = DEFAULT_LAYER_SVG;
                }
                if (value === "model3d" && !target.model3dScene) {
                  updates.model3dScene = {
                    ...DEFAULT_MODEL3D_SCENE,
                    meshMaterials: {},
                  };
                }
                updateTarget(timelineId, target.id, updates);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shape">Forma</SelectItem>
                <SelectItem value="text">Testo</SelectItem>
                <SelectItem value="image">Immagine</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="model3d">Modello 3D</SelectItem>
              </SelectContent>
            </Select>

            {target.type === "shape" ? (
              <Select
                value={target.shape ?? "square"}
                onValueChange={(value: TargetShape) =>
                  updateTarget(timelineId, target.id, { shape: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHAPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {target.type === "text" ? (
              <>
                <Input
                  className="h-8 text-xs"
                  value={target.text ?? ""}
                  placeholder="Contenuto testo"
                  onChange={(e) =>
                    updateTarget(timelineId, target.id, {
                      text: e.target.value,
                    })
                  }
                />
                <div className="space-y-1.5">
                  <Label className="text-xxs text-muted-foreground">
                    SplitText
                  </Label>
                  <Select
                    value={target.textSplit ?? "none"}
                    onValueChange={(value: TextSplitMode) =>
                      updateTarget(timelineId, target.id, { textSplit: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      <SelectItem value="chars">Caratteri</SelectItem>
                      <SelectItem value="words">Parole</SelectItem>
                      <SelectItem value="lines">Righe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {target.type === "image" ? (
              <ImageLayerFields
                imageUrl={target.imageUrl}
                onChange={(imageUrl) =>
                  updateTarget(timelineId, target.id, { imageUrl })
                }
              />
            ) : null}

            {target.type === "model3d" ? (
              <>
                <Model3dLayerFields
                  model3dUrl={target.model3dUrl}
                  onChange={(model3dUrl) =>
                    updateTarget(timelineId, target.id, { model3dUrl })
                  }
                />
                <Model3dSceneFields
                  settings={target.model3dScene}
                  meshNames={target.model3dMeshNames}
                  onChange={(model3dScene) =>
                    updateTarget(timelineId, target.id, { model3dScene })
                  }
                />
                <Model3dInteractionTriggerButton
                  config={target.model3dInteractions}
                  meshNames={target.model3dMeshNames}
                  onChange={(model3dInteractions) =>
                    updateTarget(timelineId, target.id, { model3dInteractions })
                  }
                />
              </>
            ) : null}

            {timelineMeta?.playbackType === "scroll" ? (
              <div className="rounded-md border border-dashed border-border/80 p-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    className="text-xxs text-muted-foreground"
                    title="ScrollTrigger pin: il layer resta fisso mentre scrolli; i keyframe scrubbano i transform."
                  >
                    Blocca in scroll (pin)
                  </Label>
                  <Switch
                    checked={target.scrollPin ?? false}
                    onCheckedChange={(checked) =>
                      setExclusiveScrollPin(timelineId, target.id, checked)
                    }
                  />
                </div>
         
              </div>
            ) : null}

            <div className="rounded-md border border-dashed border-border/80 p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xxs text-muted-foreground">
                  Draggable (GSAP)
                </Label>
                <Switch
                  checked={target.draggable?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    updateTarget(timelineId, target.id, {
                      draggable: {
                        ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                        enabled: checked,
                      },
                    })
                  }
                />
              </div>
              {target.draggable?.enabled ? (
                <>
                  <Select
                    value={target.draggable?.type ?? "x,y"}
                    onValueChange={(value: DraggableAxisType) =>
                      updateTarget(timelineId, target.id, {
                        draggable: {
                          ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                          enabled: true,
                          type: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x">Asse X</SelectItem>
                      <SelectItem value="y">Asse Y</SelectItem>
                      <SelectItem value="x,y">X e Y</SelectItem>
                      <SelectItem value="rotation">Rotazione</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder={`vuoto = ${projectBoundsHint}, parent`}
                    value={target.draggable?.bounds ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      updateTarget(timelineId, target.id, {
                        draggable: {
                          ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                          enabled: true,
                          bounds: raw.trim() === "" ? undefined : raw,
                        },
                      });
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`inertia-${target.id}`}
                      checked={target.draggable?.inertia ?? false}
                      onCheckedChange={(checked) =>
                        updateTarget(timelineId, target.id, {
                          draggable: {
                            ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                            enabled: true,
                            inertia: checked,
                          },
                        })
                      }
                    />
                    <Label
                      htmlFor={`inertia-${target.id}`}
                      className="text-xxs cursor-pointer"
                    >
                      Inertia (flick)
                    </Label>
                  </div>
                </>
              ) : null}
            </div>

            {target.type === "svg" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xxs text-muted-foreground">
                    Selettore path (DrawSVG / MorphSVG)
                  </Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={target.svgPathSelector ?? "#draw-path"}
                    placeholder="#draw-path"
                    onChange={(e) =>
                      updateTarget(timelineId, target.id, {
                        svgPathSelector: e.target.value,
                      })
                    }
                  />
                </div>
                <SvgLayerFields
                  svgContent={target.svgContent}
                  onChange={(svgContent) =>
                    updateTarget(timelineId, target.id, { svgContent })
                  }
                />
              </>
            ) : null}
          </div>
        ))}
      </div>

      <LayerStyleDialog
        open={styleTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setStyleTargetId(null);
        }}
        target={targets.find((t) => t.id === styleTargetId) ?? null}
        onSave={(style: TargetLayerStyle) => {
          if (!styleTargetId) return;
          updateTarget(timelineId, styleTargetId, { style });
        }}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[360px]">
          <DialogHeader>
            <DialogTitle>Nuovo layer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={`Layer ${targets.length + 1}`}
              value={newLayer.name}
              onChange={(e) =>
                setNewLayer((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Select
              value={newLayer.type}
              onValueChange={(value: AnimationTargetType) =>
                setNewLayer((p) => ({
                  ...p,
                  type: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shape">Forma</SelectItem>
                <SelectItem value="text">Testo</SelectItem>
                <SelectItem value="image">Immagine</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="model3d">Modello 3D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>Aggiungi layer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}